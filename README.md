# QueryGPT

## QnA with OpenAI GPT models on Personal / Business data using Embeddings and Completion

### This project is inspired by 'knowledge base' from [trainmy.ai](https://trainmy.ai/).

## Introduction

With all the excellent capabilities of OpenAI GPT models, I have always wanted to build a Chatbot that learns from a knowledge base I provide, and answers my queries based on the knowledge base and its training data. It would serve as the perfect assistant for Tech Documentation, Scientific Papers, and Business Product Data.

After going through large documentations, code examples I have found this project by [@gidgreen](https://github.com/gidgreen/) that allowed me to build this project. In this documentation I will try to explain all the steps and requirements to build this chatbot.

## Prerequisites

This project doesn't require any python knowledge (most of the code examples on OpenAI docs are in python but I write JS) and also no need to convert your text files to JSON/JSONL, this works fine with text files.

You need to know about NodeJS, basic Javascript, and OpenAI services.

## Let's Code

We start by making a NodeJS project and installing all the necessary dependencies

```bash
mkdir QueryGPT
cd QueryGPT
npm init -y     // you can tweak your own settings or use -y for defaults
npm install @types/node dotenv openai
```

For the necessary folders

```bash
mkdir sourceData embeddedData utils
```

Don't worry if these doesn't make sense now, I'll explain everything in details.

Before starting to code we need to collect our api key from [OpenAI](https://platform.openai.com/account/api-keys). Then we create a `.env` file and paste the api key there.

In `.env`

```js
OPENAI_API_KEY = YOUR_API_KEY;
```

We start by making a utility file for our openai package configuration.

In `utils/helper.js` :

```js
require("dotenv").config(); // import variables from .env file
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

module.exports = { openai };
```

<br/>

## Embedding our data

For this example, I will be using the wikipedia page on my University - [University of Dhaka](https://en.wikipedia.org/wiki/University_of_Dhaka) as my data. When asked ChatGPT, It can't answer correctly or it will make things up for intricate details.

There are some steps I followed to format my data which makes the results more accurate due to the approach we are using. The data needs to be split in small paragraphs, this helps with the embedding process. I saved my data in `./embeddedData/sourceData.txt`

I made a new file `embedding.js`

_The embedding.js file is necessarily large so I will be explaining the code using comments there. Please refer to that file_

When executing the file with `node embedding.js`, the following gets printed in the console on successful embedding.

<pre>
Embedding Started ⌛
Sent file over to OpenAI 🚀
Embedding finished ✨
Time taken : 19 seconds
</pre>

You can inspect the `./embeddedData/embeddedFile.txt` to gain more insights. What you see there are paragraphs as keys and their vector representation returned by the embedding model as value. We will use this key value pair later in `completion.js` to craft the perfect response.

Embeddings are numerical representations of words converted to number sequences, which make it easy for computers to understand the relationships between those concepts. The more related two words are, the more their vector value will be closer.

To learn more on this topic : [Blinkdata Embedding Tutorial](https://blinkdata.com/openai-embedding-tutorial/)

<br/>

## Generating perfect response using embedding data and completion models

### _This is the most tricky yet 'woah' part._

We won't fine-tune the model which requires feeding it Questions and Answers. The approach we will take is also to embed the Question using the same embedding model.

The magic happens when we dot product _(some math shit right!)_ the embedding vectors of two paragraphs - we get a scalar value that represents the similarity between the two paragraphs in terms of their semantic meaning and context.

So, we loop through each paragraph from our context and dot product its embedding vector with the one from the question. The paragraphs with more similarity get a higher score. Then we pull 3-5 of these paragraphs and send them over to the completion model, like the highly capable 'text-davinci-003' along with the questions, and with some prompt engineering, we get the correct response.

You can use any of the two prompts.

**If you want it to answer with own knowledge if answer isn't present in provided data** :

```js
"Answer the following question, also use your own knowledge when necessary :\n\n" +
  "Context :\n" +
  paragraph.join("\n\n") +
  "\n\nQuestion :\n" +
  question +
  "?" +
  "\n\nAnswer :";
```

**If you want it to only use provided data as knowledge base and not its own** :

```js
"Answer the following question from the context, if the answer can not be deduced from the context, say 'I dont know' :\n\n" +
  "Context :\n" +
  paragraph.join("\n\n") +
  "\n\nQuestion :\n" +
  question +
  "?" +
  "\n\nAnswer :";
```

_The code is provided in `completion.js` along with explanation in comments_

When we run `completion.js` with

```js
generateCompletion("Who is acting dean of the Faculty of Business Studies");
```

In our console :

```
tsensei@desktop ~/D/QueryGPT (main)> node completion.js

Called completion function with prompt : Who is acting dean of the Faculty of Business Studies

Muhammad Abdul Moyeen is the acting dean of the Faculty of Business Studies.
```

Hurrah! We have successfully created a AI assistant that answers out queries based on our provided personalized and updated data!!
