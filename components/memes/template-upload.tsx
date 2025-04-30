"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"

interface TemplateUploadProps {
  onUploadComplete: () => void
}

export function TemplateUpload({ onUploadComplete }: TemplateUploadProps) {
  const [open, setOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState("")
  const [isPublic, setIsPublic] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]
      setFile(selectedFile)

      // Create a preview
      const reader = new FileReader()
      reader.onload = (event) => {
        setPreview(event.target?.result as string)
      }
      reader.readAsDataURL(selectedFile)

      // Set a default name based on the file name
      if (!name) {
        const fileName = selectedFile.name.split(".")[0]
        setName(fileName)
      }
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an image file to upload.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      // First, upload the image file
      const formData = new FormData()
      formData.append("file", file)

      const uploadResponse = await fetch("/api/memes/upload", {
        method: "POST",
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload image")
      }

      const { url } = await uploadResponse.json()

      // Then, create the template
      const templateResponse = await fetch("/api/memes/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          image_url: url,
          is_public: isPublic,
          text_positions: [
            {
              id: "top",
              x: 400,
              y: 50,
              width: 700,
              height: 100,
              fontSize: 48,
              color: "white",
              alignment: "center",
            },
            {
              id: "bottom",
              x: 400,
              y: 500,
              width: 700,
              height: 100,
              fontSize: 48,
              color: "white",
              alignment: "center",
            },
          ],
        }),
      })

      if (!templateResponse.ok) {
        throw new Error("Failed to create template")
      }

      toast({
        title: "Template uploaded",
        description: "Your meme template has been uploaded successfully.",
      })

      // Reset form and close dialog
      setName("")
      setIsPublic(false)
      setFile(null)
      setPreview(null)
      setOpen(false)
      onUploadComplete()
    } catch (error) {
      console.error("Error uploading template:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Upload className="mr-2 h-4 w-4" />
          Upload Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Meme Template</DialogTitle>
          <DialogDescription>
            Upload an image to use as a meme template. You can add text positions later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Template Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your template"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="file">Template Image</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="file"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                Select Image
              </Button>
              <span className="text-sm text-muted-foreground">{file ? file.name : "No file selected"}</span>
            </div>
          </div>
          {preview && (
            <div className="mt-4">
              <div className="relative aspect-video overflow-hidden rounded-md border">
                <img src={preview || "/placeholder.svg"} alt="Preview" className="object-contain w-full h-full" />
              </div>
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Switch id="public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="public">Make this template public</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleUpload} disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
