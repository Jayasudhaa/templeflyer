import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST - Track an event (view, click, RSVP, etc.)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, action } = body;

    if (!event_id || !action) {
      return NextResponse.json(
        { error: "event_id and action are required" },
        { status: 400 }
      );
    }

    // Get IP and user agent
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const referer = req.headers.get("referer") || "";

    // Insert analytics event
    const { error } = await supabase
      .from("event_analytics")
      .insert({
        event_id,
        action,
        ip_address: ip,
        user_agent: userAgent.substring(0, 500),
        referer: referer.substring(0, 500),
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Analytics insert error:", error);
      // Don't fail the request if analytics fails
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    console.error("Analytics error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// GET - Retrieve analytics for an event
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("event_id");

    if (!eventId) {
      return NextResponse.json(
        { error: "event_id parameter is required" },
        { status: 400 }
      );
    }

    // Get all analytics for this event
    const { data: analytics, error } = await supabase
      .from("event_analytics")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch analytics" },
        { status: 500 }
      );
    }

    // Calculate summary
    const summary = {
      total_events: analytics.length,
      views: analytics.filter((a) => a.action === "view").length,
      rsvp_yes: analytics.filter((a) => a.action === "rsvp_yes").length,
      rsvp_no: analytics.filter((a) => a.action === "rsvp_no").length,
      rsvp_maybe: analytics.filter((a) => a.action === "rsvp_maybe").length,
      unique_ips: new Set(analytics.map((a) => a.ip_address)).size,
    };

    // Group by action
    const actionCounts: Record<string, number> = {};
    analytics.forEach((a) => {
      actionCounts[a.action] = (actionCounts[a.action] || 0) + 1;
    });

    return NextResponse.json({
      success: true,
      summary,
      actionCounts,
      recentEvents: analytics.slice(0, 100), // Last 100 events
    });

  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
