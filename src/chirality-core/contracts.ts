// Core Chirality document types with strict contracts
export type DS = { 
  data_field: string; 
  units?: string; 
  type?: string; 
  source_refs?: string[]; 
  notes?: string[] 
};

export type SP = { 
  step: string; 
  purpose?: string; 
  inputs?: string[]; 
  outputs?: string[]; 
  preconditions?: string[]; 
  postconditions?: string[]; 
  refs?: string[] 
};

export type X = { 
  heading: string; 
  narrative: string; 
  precedents?: string[]; 
  successors?: string[]; 
  context_notes?: string[]; 
  refs?: string[] 
};

export type M = { 
  statement: string; 
  justification?: string; 
  trace_back?: string[]; 
  assumptions?: string[]; 
  residual_risk?: string[] 
};

// Triple wrapper for all documents
export type Triple<T> = { 
  text: T; 
  terms_used: string[]; 
  warnings: string[] 
};

export type DocKind = 'DS' | 'SP' | 'X' | 'M';
export type Round = 1 | 2 | 3;

// Iteration artifacts
export type W = { 
  changed_keys: string[]; 
  reason: string; 
  evidence?: string[] 
};

export type U = { 
  round: Round; 
  convergence: 'Open' | 'Partial' | 'Closed'; 
  open_issues?: string[]; 
  summary: string 
};

// Finals collection
export type Finals = { 
  DS?: Triple<DS>; 
  SP?: Triple<SP>; 
  X?: Triple<X>; 
  M?: Triple<M> 
};

// Retrieval result
export type Retrieved = { 
  summary: string; 
  citations: string[] 
};