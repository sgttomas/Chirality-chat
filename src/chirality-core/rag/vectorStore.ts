import { Chunk } from './chunk';

export type VecRow = { 
  id: string; 
  v: number[]; 
  meta: Omit<Chunk, 'id'> & { id: string } 
};

function dot(a: number[], b: number[]) { 
  let s = 0; 
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]; 
  return s; 
}

function norm(a: number[]) { 
  return Math.sqrt(dot(a, a)); 
}

function cos(a: number[], b: number[]) { 
  const na = norm(a), nb = norm(b); 
  return na && nb ? dot(a, b) / (na * nb) : 0; 
}

export class InMemoryVS {
  private rows: VecRow[] = [];
  
  upsert(rows: VecRow[]) { 
    this.rows.push(...rows); 
  }
  
  search(q: number[], k = 12): VecRow[] {
    return this.rows
      .map(r => ({ r, score: cos(q, r.v) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, k)
      .map(x => x.r);
  }
  
  clear() {
    this.rows = [];
  }
  
  size() {
    return this.rows.length;
  }
}