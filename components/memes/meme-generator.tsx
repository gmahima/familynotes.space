"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { MemeTemplate, TextPosition } from "@/types"

interface MemeGeneratorProps {
  template: MemeTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MemeGenerator({ template, open, onOpenChange }: MemeGeneratorProps) {
  const [generating, setGenerating] = useState(false)
  const [textInputs, setTextInputs] = useState<Record<string, string>>({})
  const [generatedMeme, setGeneratedMeme] = useState<string | null>(null)

  useEffect(() => {
    if (open && template) {
      // Initialize text inputs with empty strings
      const initialInputs: Record<string, string> = {}
      template.text_positions.forEach((position: TextPosition) => {
        initialInputs[position.id] = ""
      })
      setTextInputs(initialInputs)
      setGeneratedMeme(null)
    }
  }, [open, template])

  const handleInputChange = (id: string, value: string) => {
    setTextInputs((prev) => ({
      ...prev,
      [id]: value,
    }))
  }

  const handleGenerate = async () => {
    if (!template) return

    setGenerating(true)

    try {
      const response = await fetch("/api/memes/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templateId: template.id,
          textInputs,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate meme")
      }

      const data = await response.json()
      setGeneratedMeme(data.output_url)

      toast({
        title: "Meme generated",
        description: "Your meme has been generated successfully.",
      })
    } catch (error) {
      console.error("Error generating meme:", error)
      toast({
        title: "Generation failed",
        description: "There was an error generating your meme. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedMeme) return

    try {
      const response = await fetch(generatedMeme)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.style.display = "none"
      a.href = url
      a.download = "meme.png"
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading meme:", error)
      toast({
        title: "Download failed",
        description: "There was an error downloading your meme. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Meme</DialogTitle>
          <DialogDescription>Add text to your meme template and generate a shareable image.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!generatedMeme ? (
            <>
              <div className="relative aspect-video overflow-hidden rounded-md border">
                <Image
                  src={template.image_url || "/placeholder.svg?height=400&width=600&query=meme template"}
                  alt={template.name}
                  fill
                  className="object-contain"
                />
              </div>
              <div className="space-y-4">
                {template.text_positions.map((position: TextPosition) => (
                  <div key={position.id} className="space-y-2">
                    <Label htmlFor={`text-${position.id}`}>
                      {position.id.charAt(0).toUpperCase() + position.id.slice(1)} Text
                    </Label>
                    <Input
                      id={`text-${position.id}`}
                      value={textInputs[position.id] || ""}
                      onChange={(e) => handleInputChange(position.id, e.target.value)}
                      placeholder={`Enter ${position.id} text`}
                      maxLength={position.maxLength || 100}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-md border">
                <Image src={generatedMeme || "/placeholder.svg"} alt="Generated Meme" fill className="object-contain" />
              </div>
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Meme
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          {!generatedMeme ? (
            <>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={handleGenerate} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Meme"
                )}
              </Button>
            </>
          ) : (
            <Button type="button" variant="outline" onClick={() => setGeneratedMeme(null)}>
              Create Another
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
