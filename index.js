import express from 'express';
import bodyParser from 'body-parser';
import { readChannelMessages, sendMessage } from './slack.js';
import { askChatgpt, getAnswers } from './chatgpt.js';
import { dateToTimestamp } from './utils.js';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  // return res.send(req.body.challenge);
  const event = req.body.event;
  console.log(event);
  const { type } = event;

  if (type == 'app_mention') {
    const { text, channel } = event;
    const answer = await askChatgpt(text);
    console.log({ answer });
    await sendMessage({ channelId: channel, message: answer });
  }

  // await sendMessage({
  //   userId: 'D075VJE0RH7',
  //   message: 'hi team, hope you are doing fine!',
  // });

  // const messages = await readChannelMessages({
  //   channelId: 'C073JJJSWP7',
  //   fromTimeStamp: dateToTimestamp(2024, 1, 1),
  //   limit: 10000,
  // });
  return res.status(200).send('done');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
