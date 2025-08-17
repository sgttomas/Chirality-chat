import cfg from "@/config/selection.json";
import { selectForMirror, Doc, Bundle } from "./selector";
import { mirrorGraph } from "./mirror";
import { Finals } from "@/chirality-core/contracts";

// Convert the Finals format to our Bundle format for graph processing
function finalsToBundle(finals: Finals): Bundle {
  const bundle: Bundle = {};
  
  if (finals.DS) {
    bundle.DS = {
      id: "DS:current",
      kind: "DS",
      slug: "current",
      title: "Data Sheet",
      sections: [],
      raw: JSON.stringify(finals.DS.text, null, 2) // Convert to markdown-like format
    };
  }
  
  if (finals.SP) {
    bundle.SP = {
      id: "SP:current", 
      kind: "SP",
      slug: "current",
      title: "Procedural Checklist",
      sections: [],
      raw: JSON.stringify(finals.SP.text, null, 2)
    };
  }
  
  if (finals.X) {
    bundle.X = {
      id: "X:current",
      kind: "X", 
      slug: "current",
      title: "Solution Template",
      sections: [],
      raw: JSON.stringify(finals.X.text, null, 2)
    };
  }
  
  if (finals.M) {
    bundle.M = {
      id: "M:current",
      kind: "M",
      slug: "current", 
      title: "Guidance",
      sections: [],
      raw: JSON.stringify(finals.M.text, null, 2)
    };
  }
  
  return bundle;
}

export async function mirrorAfterWrite(finals: Finals) {
  if (process.env.FEATURE_GRAPH_ENABLED !== "true") return;
  
  const bundle = finalsToBundle(finals);
  const sel = selectForMirror(bundle, cfg as any);
  
  // Non-blocking async mirror
  queueMicrotask(() => 
    mirrorGraph({ selection_v: (cfg as any).selection_v, ...sel })
      .catch(err => console.warn("mirror deferred failed", err))
  );
}