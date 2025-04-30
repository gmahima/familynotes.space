"use client"

import { useState, useRef } from "react"
import { Mic, Square, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { transcribeAudio } from "@/app/actions/transcribe"

interface RecordButtonProps {
  onTranscriptionComplete: (text: string) => void
  onTranscribing: (isTranscribing: boolean) => void
  disabled?: boolean
}

export function RecordButtonWithAction({
  onTranscriptionComplete,
  onTranscribing,
  disabled = false,
}: RecordButtonProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    audioChunksRef.current = []

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks
        stream.getTracks().forEach((track) => track.stop())

        setIsRecording(false)
        setIsTranscribing(true)
        onTranscribing(true)

        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })

          // Create form data to send to our server action
          const formData = new FormData()
          formData.append("audio", audioBlob, "recording.webm")

          // Use the server action
          const result = await transcribeAudio(formData)

          if (result.error) {
            throw new Error(result.error)
          }

          onTranscriptionComplete(result.text)
        } catch (error) {
          console.error("Transcription error:", error)
          toast({
            title: "Transcription failed",
            description: "There was an error transcribing your audio.",
            variant: "destructive",
          })
        } finally {
          setIsTranscribing(false)
          onTranscribing(false)
        }
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error accessing microphone:", error)
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use speech-to-text.",
        variant: "destructive",
      })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={isRecording ? stopRecording : startRecording}
      disabled={disabled || isTranscribing}
      className="h-8 px-2"
      aria-label={isRecording ? "Stop recording" : "Start recording"}
    >
      {isTranscribing ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="ml-2">Transcribing...</span>
        </>
      ) : isRecording ? (
        <>
          <Square className="h-4 w-4 text-red-500" />
          <span className="ml-2">Stop</span>
        </>
      ) : (
        <>
          <Mic className="h-4 w-4" />
          <span className="ml-2">Record</span>
        </>
      )}
    </Button>
  )
}
