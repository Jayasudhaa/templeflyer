import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/rsvp-view — Log a flyer view (no auth, silent)
export async function POST(req: Request) {
  try {
    const { event_id, source = "link" } = await req.json();
    if (!event_id) return NextResponse.json({ ok: true });

    await sb.from("flyer_impressions").insert({
      event_id,
      source,
      user_agent: (req.headers.get("user-agent") || "").substring(0, 500),
      referrer: (req.headers.get("referer") || "").substring(0, 500),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true }); // never break UX
  }
}
