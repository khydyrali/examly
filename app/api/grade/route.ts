import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const GRADE_API_URL = process.env.GRADE_API_URL ?? "https://test-llm.eclinic.mn/api/v1/grade";
const GRADE_API_KEY = process.env.GRADE_API_KEY;

async function getAuthedUserId(req: NextRequest): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.toLowerCase().startsWith("bearer ") ? authHeader.slice(7) : null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!token || !supabaseUrl || !supabaseAnonKey) return null;

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

export async function POST(req: NextRequest) {
  if (!GRADE_API_KEY) {
    return NextResponse.json({ error: "AI marking is not configured on this server." }, { status: 500 });
  }

  const userId = await getAuthedUserId(req);
  if (!userId) {
    return NextResponse.json({ error: "You must be signed in to use AI marking." }, { status: 401 });
  }

  let body: { question?: string; markScheme?: string; studentAnswer?: string; maxMarks?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { question, markScheme, studentAnswer, maxMarks } = body;
  if (!markScheme || !studentAnswer) {
    return NextResponse.json({ error: "markScheme and studentAnswer are required." }, { status: 400 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 95_000);

  try {
    const upstream = await fetch(GRADE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GRADE_API_KEY}`,
      },
      body: JSON.stringify({ question, markScheme, studentAnswer, maxMarks }),
      signal: controller.signal,
    });

    const text = await upstream.text();
    const payload = text ? JSON.parse(text) : null;
    return NextResponse.json(payload, { status: upstream.status });
  } catch (err) {
    const isAbort = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({ error: isAbort ? "Grading timed out. Please try again." : "Could not reach the grading service." }, { status: 504 });
  } finally {
    clearTimeout(timeout);
  }
}
