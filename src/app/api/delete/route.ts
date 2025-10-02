import { NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";

export async function POST() {
  try {
    const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
    const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME!);

    // Delete all vectors
    await pineconeIndex.deleteAll();

    return NextResponse.json({ success: true, message: "All vectors deleted!" });
  } catch (err) {
    console.error("Delete error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to delete vectors" },
      { status: 500 }
    );
  }
}
