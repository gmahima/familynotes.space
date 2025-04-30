"use server"

import { createServerClient } from "@/lib/supabase-server"

export async function transcribeAudio(formData: FormData) {
  try {
    const supabase = createServerClient()

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { error: "Unauthorized" }
    }

    const audioFile = formData.get("audio") as File

    if (!audioFile) {
      return { error: "No audio file provided" }
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
      // @ts-ignore - FormData is not directly compatible with fetch in server actions
      body: openaiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("OpenAI API error:", errorText)
      return { error: `Transcription failed: ${response.statusText}` }
    }

    const data = await response.json()

    return { text: data.text }
  } catch (error) {
    console.error("Transcription error:", error)
    return { error: "Internal server error" }
  }
}
