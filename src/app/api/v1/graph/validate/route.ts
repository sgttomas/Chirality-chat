import { NextRequest, NextResponse } from "next/server";
import cfg from "@/config/selection.json";
import { selectForMirror } from "@/lib/graph/selector";

export async function POST(req: NextRequest) {
  const { bundle } = await req.json(); // supply a bundle (DS/SP/X/M + sections/raw)
  const sel = selectForMirror(bundle, cfg as any);
  return NextResponse.json({
    docs: sel.docs.map((d: any) => d.id),
    keepByDoc: sel.keepByDoc,
    components: sel.components.map((c: any) => ({ id: c.id, docId: c.docId }))
  });
}