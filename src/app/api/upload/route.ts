import { NextResponse } from "next/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    console.log("File reached");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 1. Save PDF temporarily
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const tmpPath = path.join(os.tmpdir(), file.name);
    await fs.writeFile(tmpPath, buffer);

    // 2. Load PDF
    const pdfLoader = new PDFLoader(tmpPath);
    const rawDocs = await pdfLoader.load();
    console.log("PDF loaded");
    console.log("PDF loaded, rawDocs length:", rawDocs.length);

    // 3. Chunk text
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 200,
      chunkOverlap: 50,
    });
    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);
    console.log("Text chunked, chunks count:", chunkedDocs.length);

    // 4. Create embeddings
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: "AIzaSyC9-xLDphiQKII_UaKPrw95F7v6iGUsSEI",
      model: "text-embedding-004",
    });

    // Sanity check: test embedding dimension
    const testVector = await embeddings.embedQuery("test");
    console.log("Test embedding dimension:", testVector.length);

    if (testVector.length !== 768) {
      throw new Error(`Embedding dimension mismatch: expected 768, got ${testVector.length}`);
    }

    console.log("Embeddings validated");

    // 5. Pinecone
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);
    console.log("Pinecone connected");

    await PineconeStore.fromDocuments(chunkedDocs, embeddings, {
      pineconeIndex,
      maxConcurrency: 5,
    });

    console.log("Pinecone stored");

    return NextResponse.json({ success: true, chunks: chunkedDocs.length });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to process PDF" },
      { status: 500 }
    );
  }
}
