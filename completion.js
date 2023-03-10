const fs = require("fs");
const { openai } = require("./utils/helper");
let embeddedPath = "./embeddedData/embeddedFile.txt";

// Config Variables
let embeddingStore = {};

const maxTokens = 100; // Just to save my money :')
const embeds_storage_prefix = "embeds:";
let embeddedQuestion;

const createPrompt = (question, paragraph) => {
  return (
    "Answer the following question, also use your own knowledge when necessary :\n\n" +
    "Context :\n" +
    paragraph.join("\n\n") +
    "\n\nQuestion :\n" +
    question +
    "?" +
    "\n\nAnswer :"
  );

  // A sample prompt if you don't want it to use its own knowledge
  // rather answer only from data you've provided

  // return (
  //   "Answer the following question from the context, if the answer can not be deduced from the context, say 'I dont know' :\n\n" +
  //   "Context :\n" +
  //   paragraph.join("\n\n") +
  //   "\n\nQuestion :\n" +
  //   question +
  //   "?" +
  //   "\n\nAnswer :"
  // );
};

// Removes the prefix from paragraph
const keyExtractParagraph = (key) => {
  return key.substring(embeds_storage_prefix.length);
};

// Calculates the similarity score of question and context paragraphs
const compareEmbeddings = (embedding1, embedding2) => {
  var length = Math.min(embedding1.length, embedding2.length);
  var dotprod = 0;

  for (var i = 0; i < length; i++) {
    dotprod += embedding1[i] * embedding2[i];
  }

  return dotprod;
};

// Loop through each context paragraph, calculates the score, sort using score and return top count(int) paragraphs
const findClosestParagraphs = (questionEmbedding, count) => {
  var items = [];

  for (const key in embeddingStore) {
    let paragraph = keyExtractParagraph(key);

    let currentEmbedding = JSON.parse(embeddingStore[key]).embedding;

    items.push({
      paragraph: paragraph,
      score: compareEmbeddings(questionEmbedding, currentEmbedding),
    });
  }

  items.sort(function (a, b) {
    return b.score - a.score;
  });

  return items.slice(0, count).map((item) => item.paragraph);
};

const generateCompletion = async (prompt) => {
  console.log(`Called completion function with prompt : ${prompt}`);

  try {
    // Retrieve embedding store and parse it
    let embeddingStoreJSON = fs.readFileSync(embeddedPath, {
      encoding: "utf-8",
      flag: "r",
    });

    embeddingStore = JSON.parse(embeddingStoreJSON);

    // Embed the prompt using embedding model

    let embeddedQuestionResponse = await openai.createEmbedding({
      input: prompt,
      model: "text-embedding-ada-002",
    });

    // Some error handling
    if (embeddedQuestionResponse.data.data.length) {
      embeddedQuestion = embeddedQuestionResponse.data.data[0].embedding;
    } else {
      throw Error("Question not embedded properly");
    }

    // Find the closest count(int) paragraphs
    let closestParagraphs = findClosestParagraphs(embeddedQuestion, 5); // Tweak this value for selecting paragraphs number

    let completionData = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "user",
          content: createPrompt(prompt, closestParagraphs),
        },
      ],
      max_tokens: maxTokens,
      temperature: 0, // Tweak for more random answers
    });

    if (!completionData.data.choices) {
      throw new Error("No answer gotten");
    }

    console.log(completionData.data.choices[0].message.content.trim());
    return completionData.data.choices[0].message.content.trim();
  } catch (error) {
    console.log(error);
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.error(`Error with OpenAI API request: ${error.message}`);
    }
  }
};

generateCompletion("Who is acting dean of the Faculty of Business Studies");
