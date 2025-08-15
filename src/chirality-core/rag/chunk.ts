export type Chunk = { 
  id: string; 
  text: string; 
  source_id: string; 
  page?: number; 
  loc?: string 
};

export function chunkText(
  source_id: string, 
  fullText: string, 
  opt = { tokens: 1000, overlap: 150 }
): Chunk[] {
  // Cheap char-proxy for tokens (~4 chars per token)
  const size = opt.tokens * 4;
  const overlap = opt.overlap * 4;
  const chunks: Chunk[] = [];
  let i = 0, idx = 0;
  
  while (i < fullText.length) {
    const end = Math.min(i + size, fullText.length);
    const seg = fullText.slice(i, end).trim();
    if (seg) {
      chunks.push({ 
        id: `${source_id}#${idx++}`, 
        text: seg, 
        source_id 
      });
    }
    i = end - overlap;
    if (i < 0) i = 0;
  }
  
  return chunks;
}