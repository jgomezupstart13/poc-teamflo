import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import { askChatgpt } from './chatgpt.js';
import { TEAMFLO_ID } from './config.js';

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

const userCache = {};

export const orchest = async (body) => {
  const { type, event } = body;
  const { user, text, channel } = event;

  console.log({ type, user, text, channel });

  if (type == 'event_callback' && user !== TEAMFLO_ID) {
    askChatgpt(text).then((answer) => {
      console.log({ answer });
      sendMessage({ channelId: channel, message: answer });
    });
    return 'one second, please';
  }

  if (type == 'app_mention') {
    const { text, channel } = event;
    askChatgpt(text).then((answer) => {
      sendMessage({ channelId: channel, message: answer });
    });
    return 'one second, please';
  }
};

async function getUserInfo(userId) {
  if (userCache[userId]) {
    return userCache[userId];
  }
  try {
    const result = await web.users.info({ user: userId });
    const user = result.user.name;
    userCache[userId] = user;
    return user;
  } catch (error) {
    console.error(`Error fetching user info for ${userId}:`, error);
    return null;
  }
}

const convertUserIdsToNames = async (messages) => {
  const result = { chat: [] };
  for (let m of messages) {
    result.chat.push({
      timestamp: m.ts,
      sender: await getUserInfo(m.user),
      message: m.text,
    });
  }

  return result;
};

const readChannelMessages = async ({
  channelId,
  fromTimeStamp,
  toTimeStamp,
  limit,
}) => {
  try {
    const { messages } = await web.conversations.history({
      channel: channelId,
      oldest: fromTimeStamp,
      latest: toTimeStamp,
      limit,
    });

    return messages;
  } catch (error) {
    console.error(error);
  }
};

const sendMessage = async ({ userId, channelId, message }) => {
  try {
    await web.chat.postMessage({
      channel: channelId ?? userId,
      text: message,
    });
  } catch (error) {
    console.error(`Error sending message: ${error}`);
  }
};

// await sendMessage({
//   userId: 'D075VJE0RH7',
//   message: 'hi team, hope you are doing fine!',
// });

// const messages = await readChannelMessages({
//   channelId: 'C073JJJSWP7',
//   fromTimeStamp: dateToTimestamp(2024, 1, 1),
//   limit: 10000,
// });
