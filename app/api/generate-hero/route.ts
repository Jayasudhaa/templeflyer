import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { AI_SYSTEM_PROMPT } from "@/lib/constants";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

// Rate limiting: 10 free generations per user per month
const MAX_FREE_GENERATIONS = 10;

function clampString(v: unknown, maxLen: number): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim();
  if (!s) return null;
  return s.length > maxLen ? s.slice(0, maxLen) : s;
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.slice("Bearer ".length);
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();

    const festival = clampString(body?.festival, 80);
    if (!festival) {
      return NextResponse.json({ error: "Invalid festival" }, { status: 400 });
    }

    const systemPrompt =
      clampString(body?.systemPrompt, 2000) ?? AI_SYSTEM_PROMPT;

    const userPrompt =
      clampString(body?.userPrompt, 800) ??
      `Create a beautiful background image for ${festival} celebration`;

    const userId = user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // ✅ efficient count query
    const { count, error: countErr } = await supabase
      .from("ai_generations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    if (countErr) {
      console.error("rate limit count error:", countErr);
      return NextResponse.json({ error: "Failed to check limit" }, { status: 500 });
    }

    const used = count ?? 0;
    if (used >= MAX_FREE_GENERATIONS) {
      return NextResponse.json(
        { error: `You've reached the limit of ${MAX_FREE_GENERATIONS} free generations this month.` },
        { status: 429 }
      );
    }

    const prompt = [systemPrompt, `User request: ${userPrompt}`].join("\n\n");

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: "b64_json",
    });

    const b64Image = response.data?.[0]?.b64_json;
    if (!b64Image) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // ✅ log generation (don’t fail user if logging fails)
    const { error: insErr } = await supabase.from("ai_generations").insert({
      user_id: userId,
      festival,
      user_prompt: userPrompt,
      system_prompt: systemPrompt,
      created_at: now.toISOString(),
    });

    if (insErr) console.error("ai_generations insert error:", insErr);

    const remaining = MAX_FREE_GENERATIONS - used - 1;

    return NextResponse.json({ b64: b64Image, remaining });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
