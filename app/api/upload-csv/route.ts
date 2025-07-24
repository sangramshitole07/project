import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { generateEmbeddings } from '@/lib/huggingface';
import { upsertEmbeddings } from '@/lib/pinecone';
import { generateUniqueId } from '@/lib/csv-processor'; // Assuming this provides unique IDs

const PINECONE_UPSERT_BATCH_SIZE = 100;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    console.log('CSV upload API endpoint hit.');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.warn('Validation failed: No file provided.');
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!file.name.endsWith('.csv')) {
      console.warn(`Validation failed: Non-CSV file uploaded: ${file.name}`);
      return NextResponse.json({ error: 'File must be a CSV' }, { status: 400 });
    }

    console.log(`Processing CSV file: ${file.name}`);
    
    const fileText = await file.text();
    console.log(`CSV file read, text length: ${fileText.length}`);
    
    const parseResult = Papa.parse(fileText, { 
      header: true, 
      skipEmptyLines: true 
    });
    
    if (parseResult.errors.length > 0) {
      console.error('CSV parsing errors encountered:', parseResult.errors);
      return NextResponse.json({ 
        error: 'Error parsing CSV file', 
        details: parseResult.errors 
      }, { status: 400 });
    }

    const rows = parseResult.data as Record<string, string>[];
    console.log(`Successfully parsed ${rows.length} rows from CSV.`);

    // ========================================================================
    // CRITICAL DATA CLEANING SECTION
    // ========================================================================
    const chunks = rows.map((row, index) => {
      // 1. Combine all cell values in a row into a single string.
      let combinedText = Object.values(row).join(' ').trim();
      
      // 2. **THIS IS THE MOST IMPORTANT STEP TO PREVENT THE API ERROR**
      //    Aggressively replace ALL double-quote characters with single-quotes.
      //    This ensures the final string can be safely embedded in a JSON payload.
      combinedText = combinedText.replace(/"/g, "'");

      // 3. Check if the row is empty after cleaning and skip if it is.
      if (combinedText.length === 0) {
        console.warn(`Skipping empty or invalid row at source index: ${index}`);
        return null;
      }
      
      return combinedText;
    }).filter((chunk): chunk is string => chunk !== null); // Filter out any null (empty) rows
    // ========================================================================

    if (chunks.length === 0) {
      console.warn('No processable data chunks were generated from the CSV.');
      return NextResponse.json({ error: 'No data found in CSV to process' }, { status: 400 });
    }

    console.log(`Generated ${chunks.length} cleaned text chunks to be embedded.`);
    
    // Generate Embeddings for the *cleaned* chunks
    console.log('Starting embedding generation...');
    const embeddings = await generateEmbeddings(chunks);
    console.log(`Successfully generated ${embeddings.length} embeddings.`);

    // Prepare vectors and upsert to Pinecone in Batches
    console.log(`Starting upsert to Pinecone in batches of ${PINECONE_UPSERT_BATCH_SIZE}...`);
    let totalUpserted = 0;

    for (let i = 0; i < chunks.length; i += PINECONE_UPSERT_BATCH_SIZE) {
      const batchEnd = Math.min(i + PINECONE_UPSERT_BATCH_SIZE, chunks.length);
      const chunkBatch = chunks.slice(i, batchEnd);
      const embeddingBatch = embeddings.slice(i, batchEnd);

      const vectors = embeddingBatch.map((embedding, index) => {
        const originalIndex = i + index;
        return {
          id: generateUniqueId(),
          values: embedding,
          metadata: {
            text: chunkBatch[index],
            filename: file.name,
            rowIndex: originalIndex,
            uploadedAt: new Date().toISOString()
          }
        };
      });

      await upsertEmbeddings(vectors);
      totalUpserted += vectors.length;
      console.log(`Upserted batch ${Math.floor(i / PINECONE_UPSERT_BATCH_SIZE) + 1}, total rows processed: ${totalUpserted}`);
    }

    console.log('Successfully processed and stored all vectors.');
    return NextResponse.json({ 
      success: true, 
      message: `Successfully processed ${totalUpserted} rows from ${file.name}`,
      rowCount: totalUpserted
    });
    
  } catch (error) {
    console.error('An unexpected error occurred in /api/upload-csv:', error);
    return NextResponse.json({ 
      error: 'Failed to process CSV file',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
