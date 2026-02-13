import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Save canvas state
export async function POST(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { canvas_json, thumbnail_url } = body;

    if (!canvas_json) {
      return NextResponse.json(
        { error: "canvas_json is required" },
        { status: 400 }
      );
    }

    console.log('💾 Saving canvas for user:', user.id);

    // Upsert canvas state (update if exists, insert if not)
    const { data, error } = await supabase
      .from("canvas_states")
      .upsert({
        user_id: user.id,
        canvas_json: JSON.stringify(canvas_json),
        thumbnail_url: thumbnail_url || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Save error:', error);
      return NextResponse.json(
        { error: "Failed to save canvas state" },
        { status: 500 }
      );
    }

    console.log('✅ Canvas saved successfully');

    return NextResponse.json({
      success: true,
      data,
      message: "Canvas saved successfully",
    });

  } catch (error: any) {
    console.error('❌ Canvas save error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Load canvas state
export async function GET(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('📂 Loading canvas for user:', user.id);

    // Get canvas state
    const { data, error } = await supabase
      .from("canvas_states")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No saved canvas found
        console.log('ℹ️ No saved canvas found');
        return NextResponse.json({
          success: true,
          data: null,
          message: "No saved canvas found",
        });
      }
      
      console.error('❌ Load error:', error);
      return NextResponse.json(
        { error: "Failed to load canvas state" },
        { status: 500 }
      );
    }

    console.log('✅ Canvas loaded successfully');

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        canvas_json: JSON.parse(data.canvas_json),
      },
      message: "Canvas loaded successfully",
    });

  } catch (error: any) {
    console.error('❌ Canvas load error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// Delete canvas state
export async function DELETE(req: NextRequest) {
  try {
    // Get auth token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    
    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('🗑️ Deleting canvas for user:', user.id);

    const { error } = await supabase
      .from("canvas_states")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error('❌ Delete error:', error);
      return NextResponse.json(
        { error: "Failed to delete canvas state" },
        { status: 500 }
      );
    }

    console.log('✅ Canvas deleted successfully');

    return NextResponse.json({
      success: true,
      message: "Canvas deleted successfully",
    });

  } catch (error: any) {
    console.error('❌ Canvas delete error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
