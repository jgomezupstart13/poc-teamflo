import axios from 'axios';

const chatHistory = {
  //by user "id" : [text, text]
};

export const getAnswers = async (messages) => {
  const url =
    'https://q4hghqv3kmmulov4intjbriwqa0hnbvi.lambda-url.us-east-1.on.aws/';
  const request = {
    chat: messages,
    questions: [
      'What user is more active?',
      'What user ask more questions?',
      'What is the average respond time?',
    ],
  };

  const { data } = await axios.post(url, request);

  return data;
};

export const askChatgpt = async (question, history = []) => {
  const url =
    'https://qy56ruzxiokam4337xsmybu22m0zofit.lambda-url.us-east-1.on.aws/';
  const request = [...history, { role: 'user', content: `${question}` }];

  const {
    data: { content },
  } = await axios.post(url, request);

  return content;
};
