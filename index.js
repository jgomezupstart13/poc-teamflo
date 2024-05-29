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

  await sendMessage({
    userId: 'C073JJJSWP7',
    message: 'hi team, hope you are doing fine!',
  });

  // const messages = await readChannelMessages({
  //   channelId: 'C073JJJSWP7',
  //   fromTimeStamp: dateToTimestamp(2024, 1, 1),
  //   limit: 10000,
  // });
  res.send('done');
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
