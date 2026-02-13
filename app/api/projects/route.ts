// ============================================================================
// FILE: app/api/projects/route.ts
// PURPOSE: CRUD operations for flyer projects
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// ============================================================================
// GET - List user's projects
// ============================================================================
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's projects
    const { data: projects, error: projectsError } = await supabase
      .from('flyer_projects')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_template', false)
      .order('updated_at', { ascending: false });

    if (projectsError) {
      return NextResponse.json(
        { success: false, error: projectsError.message },
        { status: 500 }
      );
    }

    // Get templates
    const { data: templates, error: templatesError } = await supabase
      .from('flyer_projects')
      .select('*')
      .eq('is_template', true)
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      success: true,
      projects: projects || [],
      templates: templates || []
    });

  } catch (error: any) {
    console.error('Projects GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST - Create or update project
// ============================================================================
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { 
      project_name, 
      canvas_json, 
      thumbnail_url,
      description,
      category 
    } = await req.json();

    if (!project_name || !canvas_json) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Upsert project (update if exists, insert if new)
    const { data, error } = await supabase
      .from('flyer_projects')
      .upsert({
        user_id: user.id,
        project_name,
        canvas_json,
        thumbnail_url: thumbnail_url || null,
        description: description || null,
        category: category || 'personal',
        updated_at: new Date().toISOString(),
        last_opened_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,project_name'
      })
      .select()
      .single();

    if (error) {
      console.error('Project save error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      project: data,
      message: 'Project saved successfully'
    });

  } catch (error: any) {
    console.error('Projects POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE - Delete a project
// ============================================================================
export async function DELETE(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('id');

    if (!projectId) {
      return NextResponse.json(
        { success: false, error: 'Missing project ID' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('flyer_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully'
    });

  } catch (error: any) {
    console.error('Projects DELETE error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
