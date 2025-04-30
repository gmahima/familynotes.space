import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"
import sharp from "sharp"
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

    const { templateId, textInputs } = await req.json()

    if (!templateId || !textInputs) {
      return new NextResponse("Template ID and text inputs are required", { status: 400 })
    }

    // Get the template
    const { data: template, error: templateError } = await supabase
      .from("meme_templates")
      .select("*")
      .eq("id", templateId)
      .single()

    if (templateError || !template) {
      console.error("Error fetching template:", templateError)
      return new NextResponse("Template not found", { status: 404 })
    }

    // Fetch the image
    const imageResponse = await fetch(template.image_url)
    if (!imageResponse.ok) {
      return new NextResponse("Failed to fetch template image", { status: 500 })
    }

    const imageBuffer = await imageResponse.arrayBuffer()

    // Process the image with Sharp
    const image = sharp(Buffer.from(imageBuffer))
    const metadata = await image.metadata()

    const width = metadata.width || 800
    const height = metadata.height || 600

    // Create an SVG with the text overlays
    const svgText = template.text_positions
      .map((position: any) => {
        const text = textInputs[position.id] || ""
        return `
        <text
          x="${position.x}"
          y="${position.y + position.fontSize}" 
          font-family="Impact"
          font-size="${position.fontSize}px"
          fill="${position.color || "white"}"
          stroke="black"
          stroke-width="2"
          text-anchor="${position.alignment || "middle"}"
        >${text}</text>
      `
      })
      .join("")

    const svgImage = `
      <svg width="${width}" height="${height}">
        ${svgText}
      </svg>
    `

    // Composite the SVG text over the image
    const outputBuffer = await image
      .composite([
        {
          input: Buffer.from(svgImage),
          gravity: "northwest",
        },
      ])
      .toBuffer()

    // Generate a unique filename
    const filename = `meme-${uuidv4()}.png`

    // Upload the generated meme to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("memes")
      .upload(`generated/${user.id}/${filename}`, outputBuffer, {
        contentType: "image/png",
        upsert: false,
      })

    if (uploadError) {
      console.error("Error uploading generated meme:", uploadError)
      return new NextResponse("Error uploading generated meme", { status: 500 })
    }

    // Get the public URL
    const { data: publicUrlData } = supabase.storage.from("memes").getPublicUrl(`generated/${user.id}/${filename}`)

    const outputUrl = publicUrlData.publicUrl

    // Save the generation record
    const { data: generationData, error: generationError } = await supabase
      .from("meme_generations")
      .insert({
        template_id: templateId,
        user_id: user.id,
        text_inputs: textInputs,
        output_url: outputUrl,
      })
      .select()

    if (generationError) {
      console.error("Error saving meme generation:", generationError)
      return new NextResponse("Error saving meme generation", { status: 500 })
    }

    return NextResponse.json({
      id: generationData[0].id,
      output_url: outputUrl,
    })
  } catch (error) {
    console.error("Error in POST /api/memes/generate:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
