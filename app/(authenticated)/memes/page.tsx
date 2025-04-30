"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TemplateUpload } from "@/components/memes/template-upload"
import { TemplateCard } from "@/components/memes/template-card"
import { TemplateEditor } from "@/components/memes/template-editor"
import { MemeGenerator } from "@/components/memes/meme-generator"
import type { MemeTemplate } from "@/types"

export default function MemesPage() {
  const [publicTemplates, setPublicTemplates] = useState<MemeTemplate[]>([])
  const [myTemplates, setMyTemplates] = useState<MemeTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTemplate, setSelectedTemplate] = useState<MemeTemplate | null>(null)
  const [editingTemplate, setEditingTemplate] = useState<MemeTemplate | null>(null)
  const [generatorOpen, setGeneratorOpen] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)

  const fetchTemplates = async () => {
    setLoading(true)
    try {
      // Fetch public templates
      const publicResponse = await fetch("/api/memes/templates?public=true")
      if (publicResponse.ok) {
        const publicData = await publicResponse.json()
        setPublicTemplates(publicData)
      }

      // Fetch user's templates
      const myResponse = await fetch("/api/memes/templates")
      if (myResponse.ok) {
        const myData = await myResponse.json()
        setMyTemplates(myData)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTemplates()
  }, [])

  const handleSelectTemplate = (template: MemeTemplate) => {
    setSelectedTemplate(template)
    setGeneratorOpen(true)
  }

  const handleEditTemplate = (template: MemeTemplate) => {
    setEditingTemplate(template)
    setEditorOpen(true)
  }

  const handleDeleteTemplate = (template: MemeTemplate) => {
    setMyTemplates((prev) => prev.filter((t) => t.id !== template.id))
    if (template.is_public) {
      setPublicTemplates((prev) => prev.filter((t) => t.id !== template.id))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Meme Generator</h2>
          <p className="text-muted-foreground">Create and share memes with your family and friends.</p>
        </div>
        <TemplateUpload onUploadComplete={fetchTemplates} />
      </div>

      <Tabs defaultValue="public" className="space-y-4">
        <TabsList>
          <TabsTrigger value="public">Public Templates</TabsTrigger>
          <TabsTrigger value="my">My Templates</TabsTrigger>
        </TabsList>
        <TabsContent value="public" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video bg-muted rounded-md animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : publicTemplates.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">No public templates available</h3>
              <p className="text-muted-foreground">
                Upload your own templates and make them public to share with others.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {publicTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  isOwner={myTemplates.some((t) => t.id === template.id)}
                />
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="my" className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="aspect-video bg-muted rounded-md animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : myTemplates.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium">You haven't uploaded any templates yet</h3>
              <p className="text-muted-foreground">Upload your first template to start creating memes.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {myTemplates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleSelectTemplate}
                  onEdit={handleEditTemplate}
                  onDelete={handleDeleteTemplate}
                  isOwner={true}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {selectedTemplate && (
        <MemeGenerator template={selectedTemplate} open={generatorOpen} onOpenChange={setGeneratorOpen} />
      )}

      {editingTemplate && (
        <TemplateEditor
          template={editingTemplate}
          open={editorOpen}
          onOpenChange={setEditorOpen}
          onSave={fetchTemplates}
        />
      )}
    </div>
  )
}
