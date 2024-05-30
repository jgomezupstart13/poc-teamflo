import express from 'express';
import bodyParser from 'body-parser';
import { orchest } from './slack.js';

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  // return res.send(req.body.challenge);
  orchest(req.body);
  res.status(200).send();
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
