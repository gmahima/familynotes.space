import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(req: Request) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const url = new URL(req.url)
    const isPublic = url.searchParams.get("public") === "true"
    const userId = url.searchParams.get("userId")

    let query = supabase.from("meme_templates").select("*")

    if (isPublic) {
      query = query.eq("is_public", true)
    } else if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching meme templates:", error)
      return new NextResponse("Error fetching meme templates", { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in GET /api/memes/templates:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name, image_url, is_public, text_positions } = await req.json()

    if (!name || !image_url) {
      return new NextResponse("Name and image URL are required", { status: 400 })
    }

    const { data, error } = await supabase
      .from("meme_templates")
      .insert({
        name,
        image_url,
        user_id: user.id,
        is_public: is_public || false,
        text_positions: text_positions || [],
      })
      .select()

    if (error) {
      console.error("Error creating meme template:", error)
      return new NextResponse("Error creating meme template", { status: 500 })
    }

    return NextResponse.json(data[0])
  } catch (error) {
    console.error("Error in POST /api/memes/templates:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
