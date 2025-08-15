// Minimal runtime validators for document payloads

import { DS, SP, X, Z, M, LlmTriple } from './llmContracts'

type Obj = Record<string, unknown>
const isArrStr = (v: unknown) => Array.isArray(v) && v.every(x => typeof x === 'string')

export const guard = {
  triple<T>(o: any): o is LlmTriple<T> {
    return o && typeof o === 'object' &&
      'text' in o && 'terms_used' in o && 'warnings' in o &&
      Array.isArray(o.terms_used) && Array.isArray(o.warnings)
  },
  
  DS(t: Obj): t is DS {
    return typeof t.data_field === 'string' &&
      (t.units === undefined || typeof t.units === 'string') &&
      (t.type === undefined || typeof t.type === 'string') &&
      (t.source_refs === undefined || isArrStr(t.source_refs)) &&
      (t.notes === undefined || isArrStr(t.notes))
  },
  
  SP(t: Obj): t is SP {
    return typeof t.step === 'string' &&
      (t.purpose === undefined || typeof t.purpose === 'string') &&
      (t.inputs === undefined || isArrStr(t.inputs)) &&
      (t.outputs === undefined || isArrStr(t.outputs)) &&
      (t.preconditions === undefined || isArrStr(t.preconditions)) &&
      (t.postconditions === undefined || isArrStr(t.postconditions)) &&
      (t.refs === undefined || isArrStr(t.refs))
  },
  
  X(t: Obj): t is X {
    return typeof t.heading === 'string' && typeof t.narrative === 'string'
  },
  
  Z(t: Obj): t is Z {
    return typeof t.item === 'string' &&
      (t.severity === undefined || ['Low','Medium','High'].includes(String(t.severity)))
  },
  
  M(t: Obj): t is M {
    return typeof t.statement === 'string'
  },
}