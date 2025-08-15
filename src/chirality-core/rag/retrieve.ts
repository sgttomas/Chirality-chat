import { embedAll } from '../vendor/embed';
import { InMemoryVS } from './vectorStore';

export const VS = new InMemoryVS();

export async function indexChunks(chunks: { 
  id: string; 
  text: string; 
  source_id: string; 
  page?: number 
}[]) {
  if (!chunks.length) return { count: 0 };
  
  const vecs = await embedAll(chunks.map(c => c.text));
  VS.upsert(vecs.map((v, i) => ({ 
    id: chunks[i].id, 
    v, 
    meta: { ...chunks[i], id: chunks[i].id } 
  })));
  
  return { count: chunks.length };
}

export async function retrieveSummary(query: string, k = 12) {
  if (VS.size() === 0) {
    return { summary: '', citations: [], hits: [] };
  }
  
  const [qv] = await embedAll([query]);
  const hits = VS.search(qv, k);
  
  const citations = hits.map(h => 
    `CIT:${h.meta.source_id}${h.meta.page ? `#p${h.meta.page}` : ''}`
  );
  
  // Crude stitched summary (keep it short)
  const summary = hits
    .slice(0, 5)
    .map(h => h.meta.text.replace(/\s+/g, ' ').slice(0, 300))
    .join(' … ');
    
  return { summary, citations, hits };
}