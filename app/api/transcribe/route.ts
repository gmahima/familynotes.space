import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

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

    // Get the form data from the request
    const formData = await req.formData()
    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return new NextResponse("No audio file provided", { status: 400 })
    }

    // Create form data to send to OpenAI API
    const openaiFormData = new FormData()
    openaiFormData.append("file", audioFile)
    openaiFormData.append("model", "whisper-1")

    // Send to OpenAI API
    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", errorText)
      return new NextResponse(`Transcription failed: ${response.statusText}`, { status: response.status })
    }

    const data = await response.json()

    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error("Transcription error:", error)
    return new NextResponse("Internal server error", { status: 500 })
  }
}
