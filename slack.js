import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import { askChatgpt } from './chatgpt.js';
import { TEAMFLO_ID } from './config.js';

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

const userCache = {};

const ASSISTANT = 'assistant';
const USER = 'user';

const trainingChat = {
  /* by user and traning name "sendMail": 
    [
      { role: 'user', content: 'content' },
      { role: 'assistant', content: 'content' },
      { role: 'user', content: 'content' },

    ]
  */
};

const trainingFlag = {
  //by user, true or false
};

const trainingKey = {
  //by user
};

const waitingForTrainingKey = {
  //by user
};

export const orchest = async (body) => {
  console.log({ body });
  const { command, user_id, type, event = {} } = body;

  const { user, text, channel } = event;

  console.log({ type, user, text, channel });

  if (command == '/train-teamflo-start') {
    trainingFlag[user_id] = true;
    waitingForTrainingKey[user_id] = true;
    return sendMessage({
      userId: user_id,
      message: `
      OK, let's start traning, whenever you feel I understood your intend, please trigger the command /train-teamflo-stop
      \n
      give me a key name for this training, please ex.: sendmail, readchannel, etc.
      `,
    });
  }

  //THIS IS WHEN I MENTION @TEAMFLO FROM ANY CHANNEL WHERE TEAMFLOW IS ADDED PREVIOUSLY
  //DIRECT TALK TO THE BOT
  if (
    (type == 'app_mention' || type == 'event_callback') &&
    user !== TEAMFLO_ID
  ) {
    if (waitingForTrainingKey[user] && !/^[a-zA-Z]+$/.test(text)) {
      return sendMessage({
        channelId: channel,
        message:
          'Before continue, please provide a training key, ex. sendmail, readchannel, etc.',
      });
    }

    if (waitingForTrainingKey[user] && /^[a-zA-Z]+$/.test(text)) {
      waitingForTrainingKey[user] = false;
      trainingKey[user] = text;

      return sendMessage({
        channelId: channel,
        message: `great!, the training key is ${text}\nLet's begin, ex. When I tell ... you respond...`,
      });
    }

    const key = trainingKey[user];
    const history = trainingChat[user][key];

    if (trainingFlag[user]) {
      return askChatgpt(text, history).then((answer) => {
        trainingChat[user][key] = [
          ...trainingChat[user][key],
          { role: USER, content: text },
          { role: ASSISTANT, content: answer },
        ];
      });
    }

    return askChatgpt(text, history).then((answer) => {
      sendMessage({ channelId: channel, message: answer });
    });
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
