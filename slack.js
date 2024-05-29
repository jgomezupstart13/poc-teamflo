import 'dotenv/config';
import { WebClient } from '@slack/web-api';

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

const userCache = {};
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

export const convertUserIdsToNames = async (messages) => {
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

export const readChannelMessages = async ({
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

export const sendMessage = async ({ userId, channelId, message }) => {
  try {
    await web.chat.postMessage({
      channel: channelId ?? userId,
      text: message,
    });
  } catch (error) {
    console.error(`Error sending message: ${error}`);
  }
};
