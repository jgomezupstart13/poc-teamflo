import 'dotenv/config';
import { WebClient } from '@slack/web-api';
import { askChatgpt } from './chatgpt.js';
import { TEAMFLO_ID } from './config.js';
import { dateToTimestamp } from './utils.js';

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

const userCache = {};

const ASSISTANT = 'assistant';
const USER = 'user';

const trainingChat = {
  /* by user
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

export const orchest = async (body) => {
  // console.log({ body });
  const { command, user_id, type, event = {} } = body;

  const { user, text, channel } = event;

  console.log({ type, user, text, channel });

  const history = trainingChat[user_id || user] || [];

  if (/^@command/.test(text)) {
    //read messages and send answer to questions to specific channel
    if (/^@command:readChannel@channel:.+?@questions:.+$/.test(text)) {
      const [channel, questions] = text
        .split('@')
        .slice(-2)
        .map((e) => e.replace(/channel:|questions:/, ''));

      const messages = await readChannelMessages({
        channelId: getChannelId(channel),
      });
      const response = await askChatgpt(
        'from the previous chat, can you respond: ' + questions,
        [...history, { role: 'user', content: JSON.stringify(messages) }]
      );

      return sendMessage({
        userId: user_id || user,
        message: response,
      });
    }

    //send a greeting to a channel
    if (/^@command:sendGreetingToChannel@to:.+$/.test(text)) {
      //example:
      //@command:sendGreetingToChannel@to:channel

      const [to] = text
        .split('@')
        .slice(-1)
        .map((e) => e.replace(/to:/, ''))
        .map((e) => getChannelId(e));

      const message = await askChatgpt(
        'say something funny to my team, the channel is ' + getChannelName(to),
        history
      );

      return sendMessage({
        channelId: to,
        message: message,
      });
    }

    return sendMessage({
      userId: user_id || user,
      message: `command: ${text} not recognized, I suggest entering training mode with /train-teamflo-start to teach me how to structure the response correctly.`,
    });
  }

  if (command == '/train-teamflow-stop') {
    trainingFlag[user_id] = false;
    return sendMessage({
      userId: user_id,
      message: 'Great! thanks for teaching me.',
    });
  }

  if (command == '/train-teamflo-start') {
    trainingFlag[user_id] = true;

    return sendMessage({
      userId: user_id,
      message: `OK, let's start traning, whenever you feel I understood your intend, please trigger the command /train-teamflo-stop. \nEx. when I tell you this... respond in this format ...`,
    });
  }

  //THIS IS WHEN I MENTION @TEAMFLO FROM ANY CHANNEL WHERE TEAMFLOW IS ADDED PREVIOUSLY
  //DIRECT TALK TO THE BOT
  if (
    (type == 'app_mention' || type == 'event_callback') &&
    user !== TEAMFLO_ID
  ) {
    if (trainingFlag[user]) {
      return askChatgpt(text, history).then((answer) => {
        trainingChat[user] = [
          ...(trainingChat[user] || []),
          { role: USER, content: text },
          { role: ASSISTANT, content: answer },
        ];
        sendMessage({
          channelId: channel,
          message: ':robot_face: training mode\n\n' + answer,
        });
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
  fromTimeStamp = dateToTimestamp(2024, 1, 1),
  toTimeStamp,
  limit = 100,
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

function getChannelId(channelName) {
  switch (channelName.trim()) {
    case 'project-teamflow':
      return 'C06JDEFE62C';
    case 'teamflo-poc':
      return 'C075GTE2BMZ';
    case 'teamflow-internal':
      return 'C073JJJSWP7';
    case 'teamflow-poc-channel':
      return 'C074S83RAF7';
    case 'u13_bogota':
      return 'C02NT6R5Q95';
  }
}

function getChannelName(channelId) {
  switch (channelId.trim()) {
    case 'C06JDEFE62C':
      return 'project-teamflow';
    case 'C075GTE2BMZ':
      return 'teamflo-poc';
    case 'C073JJJSWP7':
      return 'teamflow-internal';
    case 'C074S83RAF7':
      return 'teamflow-poc-channel';
    case 'C02NT6R5Q95':
      return 'u13_bogota';
  }
}
function formatChannelMessages(messages) {
  return messages.map((m) => ({
    user: m.user,
    timestamp: m.ts,
    message: m.text,
  }));
}
