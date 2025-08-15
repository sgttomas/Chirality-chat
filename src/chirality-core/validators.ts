import { DS, SP, X, M, Triple } from './contracts';

const isArrStr = (v: unknown): v is string[] => 
  Array.isArray(v) && v.every(x => typeof x === 'string');

export const guard = {
  triple<T>(o: any): o is Triple<T> {
    return o && typeof o === 'object' &&
      'text' in o && 'terms_used' in o && 'warnings' in o &&
      Array.isArray(o.terms_used) && Array.isArray(o.warnings);
  },
  
  DS(t: any): t is DS {
    return t && typeof t.data_field === 'string' &&
      (t.units === undefined || typeof t.units === 'string') &&
      (t.type === undefined || typeof t.type === 'string') &&
      (t.source_refs === undefined || isArrStr(t.source_refs)) &&
      (t.notes === undefined || isArrStr(t.notes));
  },
  
  SP(t: any): t is SP {
    return t && typeof t.step === 'string' &&
      (t.purpose === undefined || typeof t.purpose === 'string') &&
      (t.inputs === undefined || isArrStr(t.inputs)) &&
      (t.outputs === undefined || isArrStr(t.outputs)) &&
      (t.preconditions === undefined || isArrStr(t.preconditions)) &&
      (t.postconditions === undefined || isArrStr(t.postconditions)) &&
      (t.refs === undefined || isArrStr(t.refs));
  },
  
  X(t: any): t is X {
    return t && typeof t.heading === 'string' && typeof t.narrative === 'string' &&
      (t.precedents === undefined || isArrStr(t.precedents)) &&
      (t.successors === undefined || isArrStr(t.successors)) &&
      (t.context_notes === undefined || isArrStr(t.context_notes)) &&
      (t.refs === undefined || isArrStr(t.refs));
  },
  
  M(t: any): t is M {
    return t && typeof t.statement === 'string' &&
      (t.justification === undefined || typeof t.justification === 'string') &&
      (t.trace_back === undefined || isArrStr(t.trace_back)) &&
      (t.assumptions === undefined || isArrStr(t.assumptions)) &&
      (t.residual_risk === undefined || isArrStr(t.residual_risk));
  },
};