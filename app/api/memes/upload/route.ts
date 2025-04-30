import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import { v4 as uuidv4 } from "uuid"

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

    const formData = await req.formData()
    const file = formData.get("file") as File

    if (!file) {
      return new NextResponse("No file provided", { status: 400 })
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return new NextResponse("File must be an image", { status: 400 })
    }

    // Generate a unique filename
    const fileExt = file.name.split(".").pop()
    const filename = `template-${uuidv4()}.${fileExt}`

    // Upload the file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("memes")
      .upload(`templates/${user.id}/${filename}`, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading template:", uploadError)
      return new NextResponse("Error uploading template", { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("memes").getPublicUrl(`templates/${user.id}/${filename}`)

    return NextResponse.json({
      url: publicUrlData.publicUrl,
    })
  } catch (error) {
    console.error("Error in POST /api/memes/upload:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
