/**
 * @fileoverview This file initializes the Pinecone client and provides utility functions
 * for interacting with a Pinecone index, including upserting and querying.
 */

import { Pinecone } from '@pinecone-database/pinecone';

// Validate that the API key is available in the environment variables.
const apiKey = process.env.PINECONE_API_KEY;
if (!apiKey) {
  throw new Error('Pinecone API key is not set. Please add PINECONE_API_KEY to your .env.local file.');
}

const pinecone = new Pinecone({
  apiKey: apiKey,
});

/**
 * A helper function to get the Pinecone index, ensuring the index name is set.
 * @returns The Pinecone index object.
 */
function getPineconeIndex() {
  const indexName = process.env.PINECONE_INDEX_NAME;
  if (!indexName) {
    throw new Error('Pinecone index name is not set. Please add PINECONE_INDEX_NAME to your .env.local file.');
  }
  return pinecone.index(indexName);
}

/**
 * Upserts vectors into the configured Pinecone index.
 * @param vectors The vectors to be upserted.
 */
export async function upsertEmbeddings(vectors: any[]) {
  if (!vectors || vectors.length === 0) {
    console.warn('Upsert function called with no vectors. Skipping.');
    return;
  }
  const index = getPineconeIndex();
  try {
    await index.upsert(vectors);
    console.log(`Successfully upserted ${vectors.length} vectors.`);
  } catch (error) {
    console.error('Failed to upsert vectors to Pinecone:', error);
    throw new Error('Could not upsert vectors to Pinecone.');
  }
}

/**
 * Queries the Pinecone index for vectors similar to the given embedding.
 * @param embedding The embedding vector to find similarities for.
 * @param topK The number of similar results to return.
 * @returns A promise that resolves to an array of context strings from the matches.
 */
export async function queryPinecone(embedding: number[], topK: number): Promise<string[]> {
  if (!embedding) {
    throw new Error("An embedding vector must be provided for querying.");
  }
  const index = getPineconeIndex();
  try {
    const queryResult = await index.query({
      vector: embedding,
      topK: topK,
      includeMetadata: true,
    });

    const matches = queryResult.matches || [];
    // Extract the 'text' from metadata for context
    const context = matches.map(match => (match.metadata as { text?: string })?.text || '');
    
    console.log(`Found ${context.length} matching contexts from Pinecone.`);
    return context;

  } catch (error) {
    console.error('Failed to query Pinecone:', error);
    throw new Error('Error querying Pinecone index.');
  }
}
