import fs from 'fs';
import path from 'path';
import { Finals } from '../contracts';

const root = process.env.CHIRALITY_STORE_DIR || './store';
const statePath = path.join(root, 'state.json');

type CoreState = {
  problem: { 
    title: string; 
    statement: string; 
    initialVector: string[] 
  };
  finals: Finals;
  metadata?: {
    pass1?: any;
    generatedAt?: string;
    twoPassMode?: boolean;
    resolutionStep?: boolean;
    [key: string]: any;
  };
};

export function ensureStore() {
  if (!fs.existsSync(root)) {
    fs.mkdirSync(root, { recursive: true });
  }
  if (!fs.existsSync(statePath)) {
    const init: CoreState = { 
      problem: { title: '', statement: '', initialVector: [] }, 
      finals: {} 
    };
    fs.writeFileSync(statePath, JSON.stringify(init, null, 2));
  }
}

export function readState(): CoreState {
  ensureStore();
  try {
    return JSON.parse(fs.readFileSync(statePath, 'utf8'));
  } catch {
    return { 
      problem: { title: '', statement: '', initialVector: [] }, 
      finals: {} 
    };
  }
}

export function writeState(patch: Partial<CoreState>) {
  ensureStore();
  const cur = readState();
  const next = { 
    ...cur, 
    ...patch, 
    finals: { ...cur.finals, ...(patch.finals || {}) } 
  };
  fs.writeFileSync(statePath, JSON.stringify(next, null, 2));
  return next;
}