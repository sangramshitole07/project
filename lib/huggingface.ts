const HF_API_URL =
  "https://router.huggingface.co/hf-inference/models/sentence-transformers/all-MiniLM-L6-v2/pipeline/sentence-similarity";

// ✅ Utility to validate texts before sending to API
function isValidText(text: string): boolean {
  if (!text || typeof text !== "string" || text.trim().length < 10) return false;
  if (text.startsWith("http")) return false;
  if (text.match(/^[\d\s\-\/.,]+$/)) return false;
  return true;
}

// ✅ Hugging Face sentence similarity API wrapper
export async function callHFSimilarityAPI(data: any) {
  const apiKey = process.env.HF_API_KEY || process.env.HF_TOKEN;
  if (!apiKey) throw new Error("Missing HF_API_KEY in environment.");

  const response = await fetch(HF_API_URL, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    method: "POST",
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("HF API Error:", result);
    throw new Error(`Hugging Face API failed: ${result.error || response.statusText}`);
  }

  return result;
}

// ✅ Main function to generate pseudo-embeddings (from similarity scores)
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const referenceSentence = "This is data from a CSV file containing movie information.";
  const validTexts = texts.filter(isValidText);

  if (validTexts.length === 0) {
    console.warn("No valid texts to embed.");
    return [];
  }

  const batchSize = 10;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < validTexts.length; i += batchSize) {
    const batch = validTexts.slice(i, i + batchSize);
    const scores = await callHFSimilarityAPI({
      inputs: {
        source_sentence: referenceSentence,
        sentences: batch,
      },
    });

    const embeddings = scores.map((score: number, idx: number) => {
      const vector = new Array(384).fill(0).map((_, j) =>
        (score + Math.sin(j * batch[idx].length * 0.01)) * 0.1
      );
      return vector;
    });

    allEmbeddings.push(...embeddings);

    await new Promise((r) => setTimeout(r, 100)); // Throttle
  }

  return allEmbeddings;
}

// ✅ Similarity scores between query and dataset texts
export async function generateSimilarityScores(queryText: string, texts: string[]): Promise<number[]> {
  const validTexts = texts.filter(isValidText);
  if (validTexts.length === 0) return [];

  const result = await callHFSimilarityAPI({
    inputs: {
      source_sentence: queryText,
      sentences: validTexts,
    },
  });

  return Array.isArray(result) ? result : [];
}
