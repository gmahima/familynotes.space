import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { data, error } = await supabase.from("meme_templates").select("*").eq("id", params.id).single()

    if (error) {
      console.error("Error fetching meme template:", error)
      return new NextResponse("Error fetching meme template", { status: 500 })
    }

    if (!data) {
      return new NextResponse("Meme template not found", { status: 404 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error(`Error in GET /api/memes/templates/${params.id}:`, error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, is_public, text_positions } = await req.json()

    const updates: Record<string, any> = {}
    if (name !== undefined) updates.name = name
    if (is_public !== undefined) updates.is_public = is_public
    if (text_positions !== undefined) updates.text_positions = text_positions
    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from("meme_templates")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id) // Ensure user owns the template
      .select()

    if (error) {
      console.error("Error updating meme template:", error)
      return new NextResponse("Error updating meme template", { status: 500 })
    }

    if (!data || data.length === 0) {
      return new NextResponse("Meme template not found or not owned by user", { status: 404 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error(`Error in PUT /api/memes/templates/${params.id}:`, error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { error } = await supabase.from("meme_templates").delete().eq("id", params.id).eq("user_id", user.id) // Ensure user owns the template

    if (error) {
      console.error("Error deleting meme template:", error)
      return new NextResponse("Error deleting meme template", { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error(`Error in DELETE /api/memes/templates/${params.id}:`, error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
