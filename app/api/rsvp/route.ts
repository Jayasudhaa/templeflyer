import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_id, response, status, name, email, phone, guests = 1 } = body;

    // Validate required fields
    if (!event_id || !name) {
      return NextResponse.json(
        { error: "Missing required fields: event_id and name are required" },
        { status: 400 }
      );
    }

    // Validate status type
    const validStatuses = ["confirmed", "maybe", "blessings", "yes", "no"];
    const finalStatus = status || response || "confirmed";
    
    if (!validStatuses.includes(finalStatus)) {
      return NextResponse.json(
        { error: "Invalid status. Must be 'confirmed', 'maybe', or 'blessings'" },
        { status: 400 }
      );
    }

    // Get IP address and user agent for analytics
    const ip = req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "";

    // Determine device type
    const deviceType = userAgent.toLowerCase().includes("mobile") ? "mobile" : "desktop";

    // Insert RSVP into database
    const { data, error } = await supabase
      .from("event_rsvps")
      .insert({
        event_id,
        status: finalStatus,
        response: finalStatus, // Keep both for backwards compatibility
        name,
        email: email || null,
        phone: phone || null,
        guests: guests || 1,
        ip_address: ip,
        user_agent: userAgent.substring(0, 500),
        device_type: deviceType,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to save RSVP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      rsvp: data,
      message: "RSVP submitted successfully",
    });

  } catch (error: any) {
    console.error("RSVP submission error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// GET - Retrieve RSVPs for an event
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

    // Get all RSVPs for this event
    const { data: rsvps, error } = await supabase
      .from("event_rsvps")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch RSVPs" },
        { status: 500 }
      );
    }

    // Calculate summary
    const confirmed = rsvps.filter((r) => r.status === "confirmed" || r.response === "yes");
    const maybe = rsvps.filter((r) => r.status === "maybe");
    const blessings = rsvps.filter((r) => r.status === "blessings");
    
    const confirmedGuests = confirmed.reduce((sum, r) => sum + (r.guests || 1), 0);
    const maybeGuests = maybe.reduce((sum, r) => sum + (r.guests || 1), 0);

    const summary = {
      total: rsvps.length,
      confirmed_count: confirmed.length,
      confirmed_guests: confirmedGuests,
      maybe_count: maybe.length,
      maybe_guests: maybeGuests,
      blessings_count: blessings.length,
      from_mobile: rsvps.filter((r) => r.device_type === "mobile").length,
      from_desktop: rsvps.filter((r) => r.device_type === "desktop").length,
      total_responses: rsvps.length,
    };

    return NextResponse.json({
      success: true,
      summary,
      rsvps,
    });

  } catch (error: any) {
    console.error("RSVP fetch error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
