"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TipTapEditor } from "@/components/tiptap/tiptap-editor"
import { toast } from "@/components/ui/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Settings, Save, Loader2 } from "lucide-react"
import type { Folder } from "@/types"

interface NoteEditorProps {
  noteId?: string
  initialTitle?: string
  initialContent?: string
  initialFolderId?: string
}

export function NoteEditor({ noteId, initialTitle = "", initialContent = "", initialFolderId = "" }: NoteEditorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const folderIdFromUrl = searchParams.get("folder")
  const titleInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [folderId, setFolderId] = useState(initialFolderId || folderIdFromUrl || "")
  const [folders, setFolders] = useState<Folder[]>([])
  const [loading, setLoading] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string>("No folder")

  // Auto-focus the title input when the component mounts if it's a new note
  useEffect(() => {
    if (!noteId && titleInputRef.current) {
      titleInputRef.current.focus()
    }
  }, [noteId])

  // Fetch folders
  useEffect(() => {
    async function fetchFolders() {
      try {
        const { data, error } = await supabase.from("folders").select("*").order("name").eq("archived", false)

        if (error) throw error
        setFolders(data || [])

        // Set current folder name
        if (folderId) {
          const folder = data?.find((f) => f.id === folderId)
          if (folder) {
            setCurrentFolder(folder.name)
          }
        }
      } catch (error) {
        console.error("Error fetching folders:", error)
      }
    }

    fetchFolders()
  }, [folderId])

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!title.trim() || !noteId) return

    const timer = setTimeout(() => {
      saveNote(true)
    }, 2000)

    return () => clearTimeout(timer)
  }, [title, content])

  const saveNote = async (isAutoSave = false) => {
    if (!title.trim()) {
      if (!isAutoSave) {
        toast({
          title: "Title required",
          description: "Please enter a title for your note",
          variant: "destructive",
        })
      }
      return
    }

    if (isAutoSave) {
      setAutoSaving(true)
    } else {
      setLoading(true)
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const noteData = {
        title,
        content,
        folder_id: folderId || null,
        user_id: user.id,
        updated_at: new Date().toISOString(),
      }

      let result

      if (noteId) {
        // Update existing note
        result = await supabase.from("notes").update(noteData).eq("id", noteId).select()
      } else {
        // Create new note
        result = await supabase.from("notes").insert(noteData).select()
      }

      if (result.error) throw result.error

      if (!noteId && result.data?.[0]?.id) {
        router.push(`/notes/${result.data[0].id}`)
      }

      if (!isAutoSave) {
        toast({
          title: noteId ? "Note updated" : "Note created",
          description: noteId ? "Your note has been updated" : "Your new note has been created",
        })
      }
    } catch (error) {
      console.error("Error saving note:", error)
      if (!isAutoSave) {
        toast({
          title: "Error",
          description: "There was a problem saving your note",
          variant: "destructive",
        })
      }
    } finally {
      if (isAutoSave) {
        setAutoSaving(false)
      } else {
        setLoading(false)
      }
    }
  }

  const handleFolderChange = (folderId: string) => {
    setFolderId(folderId)
    const folder = folders.find((f) => f.id === folderId)
    setCurrentFolder(folder ? folder.name : "No folder")
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          ref={titleInputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled Note"
          className="text-xl font-semibold border-none shadow-none focus-visible:ring-0 px-0 h-auto text-2xl"
        />
        <div className="flex items-center gap-2">
          {autoSaving && (
            <div className="flex items-center text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin mr-1" />
              <span>Saving...</span>
            </div>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
                <span className="sr-only">Settings</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Note Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">Select Folder</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleFolderChange("")} className={!folderId ? "bg-accent" : ""}>
                No folder
              </DropdownMenuItem>
              {folders.map((folder) => (
                <DropdownMenuItem
                  key={folder.id}
                  onClick={() => handleFolderChange(folder.id)}
                  className={folderId === folder.id ? "bg-accent" : ""}
                >
                  {folder.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => saveNote()} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground flex items-center">
        <span>Folder: {currentFolder}</span>
      </div>

      <TipTapEditor content={content} onChange={setContent} placeholder="Start writing your note here..." />
    </div>
  )
}
