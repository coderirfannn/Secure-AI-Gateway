"use server";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { GoogleGenAI } from "@google/genai";
import { Type } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

// Security Fix: Use environment variable instead of hardcoding the key.
const ai = new GoogleGenAI({
  apiKey:"AIzaSyDaXTGvtB5Y2YsdT6LgJcsmI55qo1yJa-U",
});

type HistoryPart =
  | { text: string }
  | { functionCall: any }
  | { functionResponse: any };

// NOTE: Storing history in a global variable is not suitable for production
// as it will be shared across all users. This is okay for a simple demo.
const history: Array<{
  role: string;
  parts: HistoryPart[];
}> = [];

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
    apiKey: "AIzaSyDaXTGvtB5Y2YsdT6LgJcsmI55qo1yJa-U", // Use the same key for consistency
    model: "text-embedding-004",
  });

  const queryVector = await embeddings.embedQuery(userQuery);

  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

  console.log("Querying Pinecone...");
  const searchResults = await pineconeIndex.query({
    topK: 5, // Using 5 results instead of 10 for more focused context
    vector: queryVector,
    includeMetadata: true,
  });

  const context = searchResults.matches
    .map((match) => match?.metadata?.text)
    .join("\n\n---\n\n");

  // Debugging log to check what context is being retrieved
  console.log("--- RETRIEVED CONTEXT ---\n", context);
  
  return context;
}

// 2. Tool declaration with improved descriptions
const tavilySearchDeclaration = {
  name: "tavilySearch",
  description:
    "Search the web in real-time for up-to-date information. Use this ONLY when the user asks for very recent, live, or external information that would not be in a static document.",
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
    "Use this to answer any question about the user's uploaded documents. This is your primary tool for finding specific information like authors, university departments, dates, conclusions, or any other facts mentioned in the text.", // <-- UPDATED DESCRIPTION
  parameters: {
    type: Type.OBJECT,
    properties: {
      userQuery: {
        type: Type.STRING,
        description: "The user's natural language query to search in the documents",
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
    parts: [{ text: question }],
  });

  while (true) {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash", // Using a slightly more capable model for tool use
      contents: history,
      config: {
        // --- UPDATED SYSTEM INSTRUCTION ---
        systemInstruction: `You are an expert Q&A assistant. Your primary goal is to answer questions based on information retrieved from a set of tools.

        Here is your workflow:
        1. For any question about the content of the user's documents (e.g., authors, departments, findings, summaries, specific facts), you MUST use the "retrival" tool. Do not try to answer from your own memory.
        2. Only use the "tavilySearch" tool if the user explicitly asks for recent, real-time, or external information that would not be in a static document.
        3. Your final answer MUST be strictly based on the information returned by the tool.
        4. If the information from the tool does not contain the answer, you MUST clearly state: 'I could not find an answer in the provided documents.'
        5. Do not make up answers. Your credibility depends on sticking to the retrieved information.`,
        maxOutputTokens: 800,
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
        response: { result: result },
      };

      history.push({
        role: "model",
        parts: [{ functionCall: response.functionCalls[0] }],
      });
      history.push({
        role: "user",
        parts: [{ functionResponse: functionResponsePart }],
      });

      console.log(`Result from ${name}:`, result);
    } else {
      history.push({
        role: "model",
        parts: [{ text: response.text ?? "" }],
      });
      return response.text ?? "";
    }
  }
}