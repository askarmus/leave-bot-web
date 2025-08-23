import { NextRequest, NextResponse } from "next/server";

const PY_BASE = process.env.LEAVE_API_BASE ?? "http://127.0.0.1:8001";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const r = await fetch(`${PY_BASE}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await r.json();
    return NextResponse.json(data, { status: r.status });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Proxy error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
