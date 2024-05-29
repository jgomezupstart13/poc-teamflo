import express from 'express';
import bodyParser from 'body-parser';
import { readChannelMessages, sendMessage } from './slack.js';
import { getAnswers } from './chatgpt.js';
import { dateToTimestamp } from './utils.js';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  // return res.send(req.body.challenge);
  const messages = await readChannelMessages({
    channelId: 'C073JJJSWP7',
    fromTimeStamp: dateToTimestamp(2024, 1, 1),
    limit: 10000,
  });

  res.send(messages);
  // const messages = await readChannelMessages('C073JJJSWP7');
  // const answers = await getAnswers(messages);
  // await sendMessage('C074S83RAF7', answers);
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
