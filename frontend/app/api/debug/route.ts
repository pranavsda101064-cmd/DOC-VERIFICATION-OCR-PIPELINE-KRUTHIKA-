import { NextResponse } from "next/server";

export async function GET() {
  const raw = process.env.NEXT_PUBLIC_API_URL;
  const resolved = raw?.startsWith("http") ? raw : raw ? `https://${raw}` : "http://localhost:8000";
  return NextResponse.json({ raw_env: raw, resolved_url: resolved, node_env: process.env.NODE_ENV });
}
