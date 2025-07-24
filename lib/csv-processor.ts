export function processCSVData(data: any[]): string[] {
  const chunks: string[] = [];
  
  if (data.length === 0) return chunks;
  
  // Get headers
  const headers = Object.keys(data[0]);
  
  // Filter out columns that shouldn't be embedded (URLs, IDs, etc.)
  const textColumns = headers.filter(header => {
    const lowerHeader = header.toLowerCase();
    return !lowerHeader.includes('url') && 
           !lowerHeader.includes('link') && 
           !lowerHeader.includes('image') && 
           !lowerHeader.includes('poster') &&
           !lowerHeader.includes('id') &&
           !lowerHeader.includes('date');
  });
  
  // Process each row into a readable chunk
  data.forEach((row, index) => {
    const rowText = textColumns
      .map(header => {
        const value = row[header];
        if (!value || value === 'N/A' || value === '') return null;
        return `${header}: ${value}`;
      })
      .filter(Boolean)
      .join(', ');
    
    if (rowText.trim()) {
      chunks.push(`Row ${index + 1}: ${rowText}`);
    }
  });
  
  return chunks;
}

export function generateUniqueId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}