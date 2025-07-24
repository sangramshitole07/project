import { NextRequest, NextResponse } from 'next/server';
import { generateEmbeddings } from '@/lib/huggingface';
import { queryPinecone } from '@/lib/pinecone';
import { getGroqChatCompletion } from '@/lib/groq';

// Force the Node.js runtime to prevent edge-related issues.
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const { query } = await request.json();

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  try {
    // STEP 1: Generate Embedding
    let embedding: number[];
    try {
      console.log('Attempting to generate embedding for query...');
      [embedding] = await generateEmbeddings([query]);
      if (!embedding) {
        console.warn('Generated embedding is empty, using fallback');
        // Create a fallback embedding if needed
        embedding = new Array(384).fill(0).map(() => Math.random() * 0.1);
      }
      console.log('Successfully generated embedding.');
    } catch (error) {
      console.error('--- ERROR DURING HUGGING FACE CALL ---', error);
      // Don't throw error, use fallback embedding instead
      console.warn('Using fallback embedding due to error');
      embedding = new Array(384).fill(0).map(() => Math.random() * 0.1);
    }

    // STEP 2: Query Pinecone
    let context: string[];
    try {
      console.log('Attempting to query Pinecone...');
      context = await queryPinecone(embedding, 5);
      console.log('Successfully queried Pinecone.');
    } catch (error) {
      console.error('--- ERROR DURING PINECONE CALL ---', error);
      console.warn('Pinecone unavailable, proceeding without context. Response will be generated without CSV-specific information.');
      context = []; // Use empty context array as fallback
    }

    // STEP 3: Get Groq Completion
    console.log('Attempting to get chat completion from Groq...');
    const chatResponse = await getGroqChatCompletion(query, context);
    console.log('Successfully received chat completion from Groq.');

    return NextResponse.json({ response: chatResponse });

  } catch (error) {
    console.error('A critical error occurred in the chat API pipeline:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to process chat request', details: errorMessage }, { status: 500 });
  }
}
