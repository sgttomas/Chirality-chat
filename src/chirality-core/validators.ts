import { DS, SP, X, M, Triple } from './contracts';

const isArrStr = (v: unknown): v is string[] => 
  Array.isArray(v) && v.every(x => typeof x === 'string');

// Helper to convert string to array if needed
const toArray = (v: unknown): string[] | undefined => {
  if (v === undefined) return undefined;
  if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean);
  if (isArrStr(v)) return v;
  return undefined;
};

export const guard = {
  triple<T>(o: any): o is Triple<T> {
    return o && typeof o === 'object' &&
      'text' in o && 'terms_used' in o && 'warnings' in o &&
      Array.isArray(o.terms_used) && Array.isArray(o.warnings);
  },
  
  DS(t: any): t is DS {
    // More flexible validation - handle both string and array formats
    if (!t || typeof t.data_field !== 'string') return false;
    
    // Convert string fields to arrays if needed
    if (typeof t.notes === 'string') {
      t.notes = [t.notes];
    }
    if (typeof t.source_refs === 'string') {
      t.source_refs = t.source_refs.split(',').map((s: string) => s.trim());
    }
    
    return (t.units === undefined || typeof t.units === 'string') &&
      (t.type === undefined || typeof t.type === 'string') &&
      (t.source_refs === undefined || isArrStr(t.source_refs)) &&
      (t.notes === undefined || isArrStr(t.notes));
  },
  
  SP(t: any): t is SP {
    if (!t || typeof t.step !== 'string') return false;
    
    // Convert string fields to arrays if needed
    ['inputs', 'outputs', 'preconditions', 'postconditions', 'refs'].forEach(field => {
      if (typeof t[field] === 'string') {
        t[field] = t[field].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });
    
    return (t.purpose === undefined || typeof t.purpose === 'string') &&
      (t.inputs === undefined || isArrStr(t.inputs)) &&
      (t.outputs === undefined || isArrStr(t.outputs)) &&
      (t.preconditions === undefined || isArrStr(t.preconditions)) &&
      (t.postconditions === undefined || isArrStr(t.postconditions)) &&
      (t.refs === undefined || isArrStr(t.refs));
  },
  
  X(t: any): t is X {
    if (!t || typeof t.heading !== 'string' || typeof t.narrative !== 'string') return false;
    
    // Convert string fields to arrays if needed
    ['precedents', 'successors', 'context_notes', 'refs'].forEach(field => {
      if (typeof t[field] === 'string') {
        t[field] = [t[field]];
      }
    });
    
    return (t.precedents === undefined || isArrStr(t.precedents)) &&
      (t.successors === undefined || isArrStr(t.successors)) &&
      (t.context_notes === undefined || isArrStr(t.context_notes)) &&
      (t.refs === undefined || isArrStr(t.refs));
  },
  
  M(t: any): t is M {
    // Handle case where M is just a string (the statement itself)
    if (typeof t === 'string') {
      // Convert to proper format
      const newT = { statement: t };
      Object.assign(t, newT);
    }
    
    if (!t || typeof t.statement !== 'string') return false;
    
    // Convert string fields to arrays if needed
    ['trace_back', 'assumptions', 'residual_risk'].forEach(field => {
      if (typeof t[field] === 'string') {
        t[field] = t[field].split(',').map((s: string) => s.trim()).filter(Boolean);
      }
    });
    
    return (t.justification === undefined || typeof t.justification === 'string') &&
      (t.trace_back === undefined || isArrStr(t.trace_back)) &&
      (t.assumptions === undefined || isArrStr(t.assumptions)) &&
      (t.residual_risk === undefined || isArrStr(t.residual_risk));
  },
};