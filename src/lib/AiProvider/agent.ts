"use server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";

import * as dotenv from "dotenv";
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: "AIzaSyC9-xLDphiQKII_UaKPrw95F7v6iGUsSEI",
});

type HistoryPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };

const history: Array<{
  role: string;
  parts: HistoryPart[];
}> = [];

const groundingTool = {
  googleSearch: {},
};

// 1. Create webSearch tool
async function tavilySearch(query: string): Promise<string> {
  const resp = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.TAVILY_API_KEY!}`,
    },
    body: JSON.stringify({
      query,
      max_results: 5,
    }),
  });

  const data = await resp.json();
  return data.results.map((r: any) => r.content).join("\n\n---\n\n");
}

async function retrival(userQuery: string): Promise<string> {
  const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: "text-embedding-004",
  });

  const queryVector = await embeddings.embedQuery(userQuery);

  //   connecting pinecone
  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  console.log("pinecone configured");

  //   query and get similer results
  const searchResults = await pineconeIndex.query({
    topK: 10,
    vector: queryVector,
    includeMetadata: true,
  });

  //   console.log(searchResults);
  // getting only the text part from metadata.
  const context = searchResults.matches
    .map((match) => match?.metadata?.text)
    .join("\n\n---\n\n");

  return context;
}

// 2. Tool declaration
const tavilySearchDeclaration = {
  name: "tavilySearch",
  description:
    "Search the web in real-time for up-to-date information using Tavily API. Use this when the query requires fresh or external knowledge not in Pinecone.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The search query to look up on the web",
      },
    },
    required: ["query"],
  },
};

const retrivalDeclaration = {
  name: "retrival",
  description:
    "Retrieve relevant information from Pinecone vector database based on user query. Useful when additional context or knowledge is required before answering.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      userQuery: {
        type: Type.STRING,
        description: "The user's natural language query to search in Pinecone",
      },
    },
    required: ["userQuery"],
  },
};

// 3. Add to ToolMap
type ToolMap = {
  retrival: (args: { userQuery: string }) => Promise<string>;
  tavilySearch: (args: { query: string }) => Promise<string>;
};

const availableTools: ToolMap = {
  retrival: ({ userQuery }) => retrival(userQuery),
  tavilySearch: ({ query }) => tavilySearch(query),
};

export async function runAgent(question: string) {
  history.push({
    role: "user",
    parts: [
      {
        text: question,
      },
    ],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: history,
      config: {
        systemInstruction: `You are helpful intellugent AI agent that has tool to retrive relevant context from Pinecone vector database and also you can use another tool to make live search on the web. You can decide to whether to use tool to retrive relevant context from Pinecone vector database, search the web or answer directly based on the user's query.`,
        maxOutputTokens: 600,
        tools: [
          {
            functionDeclarations: [
              retrivalDeclaration,
              tavilySearchDeclaration,
            ],
          },
        ],
      },
    });

    if (response.functionCalls && response.functionCalls.length > 0) {
      const { name, args } = response.functionCalls[0];

      const tool = availableTools[name as keyof ToolMap];
      const result = await tool(args as any);

      const functionResponsePart = {
        name: name,
        response: {
          result: result,
        },
      };

      // model response
      history.push({
        role: "model",
        parts: [
          {
            functionCall: response.functionCalls[0],
          },
        ],
      });
      history.push({
        role: "user",
        parts: [
          {
            functionResponse: functionResponsePart,
          },
        ],
      });

      console.log(`Result from ${name}:`, result);
    } else {
      history.push({
        role: "model",
        parts: [
          {
            text: response.text ?? "",
          },
        ],
      });
      return response.text ?? "";
    }
  }
}
