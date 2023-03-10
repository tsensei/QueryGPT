const fs = require("fs");
const { openai } = require("./utils/helper");

// Config Variables

let embeddingStore = {}; // Contains embedded data for future use
const min_para_words = 5; // We will ignore paragraphs that have less than 5 words
const embeds_storage_prefix = "embeds:";

// Specify raw source file and embedded destination file path
let sourcePath = "./sourceData/sourceFile.txt";
let destPath = "./embeddedData/embeddedFile.txt";

const generateEmbedding = async () => {
  // Reads the raw text file
  console.log("Embedding Started ⌛");

  let rawText = fs.readFileSync(sourcePath, {
    encoding: "utf-8",
    flag: "r",
  });

  // Paragraph store after splitting
  let paras = [];

  // Split text into paragraphs
  // To understand this regex, head over to https://regexr.com/
  let rawParas = rawText.split(/\n\s*\n/);

  // Some more formatting and pushing each paragraph to paras[]
  for (let i = 0; i < rawParas.length; i++) {
    let rawPara = rawParas[i].trim().replaceAll("\n", " ").replace(/\r/g, "");

    // Check of it is a question and has greater length than minimum
    if (rawPara.charAt(rawPara.length - 1) != "?") {
      if (rawPara.split(/\s+/).length >= min_para_words) {
        paras.push(rawPara);
      }
    }
  }

  var countParas = paras.length;

  // Generate unix timestamp
  var startTime = new Date().getTime();

  // Sending data over to embedding model
  try {
    console.log("Sent file over to OpenAI 🚀");

    const response = await openai.createEmbedding({
      input: paras,
      model: "text-embedding-ada-002",
    });

    let completionTime = new Date().getTime();

    // Check if data recieved correctly
    if (response.data.data.length >= countParas) {
      for (let i = 0; i < countParas; i++) {
        // Adding each embedded para to embeddingStore
        embeddingStore[embeds_storage_prefix + paras[i]] = JSON.stringify({
          embedding: response.data.data[i].embedding,
          created: startTime,
        });
      }
    }

    // Write embeddingStore to destination file
    fs.writeFileSync(destPath, JSON.stringify(embeddingStore));

    console.log("Embedding finished ✨");
    console.log(`Time taken : ${(completionTime - startTime) / 1000} seconds`);
  } catch (error) {
    console.log("Some error happened");
    // Error handling code
    if (error.response) {
      console.error(error.response.status, error.response.data);
    } else {
      console.log(error);
    }
  }
};

generateEmbedding();
