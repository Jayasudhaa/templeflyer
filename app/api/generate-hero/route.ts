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

export async function POST(req: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
}

    const body = await req.json();
    const { festival, userPrompt, systemPrompt } = body;
    if (!festival || typeof festival !== "string") {

      return NextResponse.json({ error: "Invalid festival" }, { status: 400 });
    }

    // Use system prompt from constants if not provided
    const finalSystemPrompt = systemPrompt || AI_SYSTEM_PROMPT;
    const finalUserPrompt = userPrompt || `Create a beautiful background image for ${festival} celebration`;
    // Check rate limit
    const userId = user.id;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data: existingGenerations } = await supabase
      .from("ai_generations")
      .select("*")
      .eq("user_id", userId)
      .gte("created_at", monthStart.toISOString());

    const count = existingGenerations?.length ?? 0;

    if (count >= MAX_FREE_GENERATIONS) {
      return NextResponse.json(
        { error: `You've reached the limit of ${MAX_FREE_GENERATIONS} free generations this month.` },
        { status: 429 }
      );
    }

    // Generate image using DALL-E 3
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `${finalSystemPrompt}\n\n${finalUserPrompt}`,
      size: "1024x1024",
      quality: "standard",
      n: 1,
      response_format: "b64_json",
    });

    const b64Image = response.data[0]?.b64_json;
    if (!b64Image) {
      return NextResponse.json({ error: "No image generated" }, { status: 500 });
    }

    // Log generation to database
    await supabase.from("ai_generations").insert({
          user_id: userId,
      festival,
      user_prompt: finalUserPrompt,
      system_prompt: finalSystemPrompt,
      created_at: now.toISOString(),
    });

    const remaining = MAX_FREE_GENERATIONS - count - 1;

    return NextResponse.json({
      b64: b64Image,
      remaining,
    });
  } catch (error: any) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate image" },
      { status: 500 }
    );
  }
}
