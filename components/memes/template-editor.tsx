"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { Loader2, Save } from "lucide-react"
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
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import type { MemeTemplate } from "@/types"

interface TemplateEditorProps {
  template: MemeTemplate
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: () => void
}

export function TemplateEditor({ template, open, onOpenChange, onSave }: TemplateEditorProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(template.name)
  const [isPublic, setIsPublic] = useState(template.is_public)

  useEffect(() => {
    if (open) {
      setName(template.name)
      setIsPublic(template.is_public)
    }
  }, [open, template])

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your template.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const response = await fetch(`/api/memes/templates/${template.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          is_public: isPublic,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update template")
      }

      toast({
        title: "Template updated",
        description: "Your meme template has been updated successfully.",
      })

      onOpenChange(false)
      onSave()
    } catch (error) {
      console.error("Error updating template:", error)
      toast({
        title: "Update failed",
        description: "There was an error updating your template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Meme Template</DialogTitle>
          <DialogDescription>Update your meme template details.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Template Name</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter a name for your template"
            />
          </div>
          <div className="mt-4">
            <div className="relative aspect-video overflow-hidden rounded-md border">
              <Image
                src={template.image_url || "/placeholder.svg?height=400&width=600&query=meme template"}
                alt={template.name}
                fill
                className="object-contain"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="edit-public" checked={isPublic} onCheckedChange={setIsPublic} />
            <Label htmlFor="edit-public">Make this template public</Label>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
