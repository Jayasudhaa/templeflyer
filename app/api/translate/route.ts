import { NextRequest, NextResponse } from "next/server";

const GOOGLE_TRANSLATE_API_KEY = process.env.GOOGLE_TRANSLATE_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text, targetLang } = await req.json();

    if (!text || !targetLang) {
      return NextResponse.json(
        { error: "Missing text or targetLang" },
        { status: 400 }
      );
    }

    if (!GOOGLE_TRANSLATE_API_KEY) {
      return NextResponse.json(
        { error: "Google Translate API key not configured" },
        { status: 500 }
      );
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${GOOGLE_TRANSLATE_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: text,
        target: targetLang,
        format: "text",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData?.error?.message || "Translation failed");
    }

    const data = await response.json();
    const translatedText = data?.data?.translations?.[0]?.translatedText;

    if (!translatedText) {
      throw new Error("No translation returned");
    }

    return NextResponse.json({
      translatedText,
      detectedSourceLanguage: data?.data?.translations?.[0]?.detectedSourceLanguage,
    });
  } catch (error: any) {
    console.error("Translation error:", error);
    return NextResponse.json(
      { error: error?.message || "Translation failed" },
      { status: 500 }
    );
  }
}
