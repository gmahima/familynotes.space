"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  FolderIcon,
  FolderPlus,
  PlusCircle,
  CreditCard,
  ImageIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { Folder, Note } from "@/types"
import { supabase } from "@/lib/supabase"

export function Sidebar() {
  const pathname = usePathname()
  const [folders, setFolders] = useState<Folder[]>([])
  const [recentNotes, setRecentNotes] = useState<Note[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({})
  const [folderNotes, setFolderNotes] = useState<Record<string, Note[]>>({})
  const [loading, setLoading] = useState(true)

  // Fetch folders and recent notes
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch folders
        const { data: folderData, error: folderError } = await supabase
          .from("folders")
          .select("*")
          .order("name")
          .eq("archived", false)

        if (folderError) throw folderError
        setFolders(folderData || [])

        // Fetch recent notes
        const { data: noteData, error: noteError } = await supabase
          .from("notes")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(5)

        if (noteError) throw noteError
        setRecentNotes(noteData || [])
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Fetch notes for a folder when expanded
  const fetchFolderNotes = async (folderId: string) => {
    try {
      const { data, error } = await supabase.from("notes").select("*").eq("folder_id", folderId).order("title")

      if (error) throw error
      setFolderNotes((prev) => ({ ...prev, [folderId]: data || [] }))
    } catch (error) {
      console.error("Error fetching folder notes:", error)
    }
  }

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const isExpanded = !prev[folderId]
      if (isExpanded && !folderNotes[folderId]) {
        fetchFolderNotes(folderId)
      }
      return { ...prev, [folderId]: isExpanded }
    })
  }

  return (
    <div className="group flex h-full w-[240px] flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <BookOpen className="h-5 w-5" />
          <span>Family Notes</span>
        </Link>
      </div>
      <div className="flex items-center gap-2 p-4">
        <Link href="/notes/new" className="w-full">
          <Button className="w-full justify-start gap-2">
            <PlusCircle className="h-4 w-4" />
            New Note
          </Button>
        </Link>
      </div>
      <ScrollArea className="flex-1 px-3">
        <div className="space-y-6 py-3">
          <div>
            <h3 className="mb-2 px-4 text-sm font-medium">Recent Notes</h3>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-1">
                {recentNotes.length === 0 ? (
                  <p className="px-4 text-sm text-muted-foreground">No recent notes</p>
                ) : (
                  recentNotes.map((note) => (
                    <Link key={note.id} href={`/notes/${note.id}`}>
                      <div
                        className={cn(
                          "flex items-center rounded-md px-4 py-2 text-sm",
                          pathname === `/notes/${note.id}` ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                        )}
                      >
                        <span className="truncate">{note.title}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            )}
          </div>
          <Separator />
          <div>
            <div className="mb-2 flex items-center justify-between px-4">
              <h3 className="text-sm font-medium">Folders</h3>
              <Link href="/folders/new">
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <FolderPlus className="h-4 w-4" />
                  <span className="sr-only">New Folder</span>
                </Button>
              </Link>
            </div>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              <div className="space-y-1">
                {folders.length === 0 ? (
                  <p className="px-4 text-sm text-muted-foreground">No folders</p>
                ) : (
                  folders.map((folder) => (
                    <div key={folder.id} className="space-y-1">
                      <button
                        onClick={() => toggleFolder(folder.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-md px-4 py-2 text-sm hover:bg-accent/50",
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <FolderIcon className="h-4 w-4" />
                          <span>{folder.name}</span>
                        </div>
                        {expandedFolders[folder.id] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedFolders[folder.id] && (
                        <div className="ml-4 pl-2 border-l">
                          {!folderNotes[folder.id] ? (
                            <div className="py-2">
                              <Skeleton className="h-6 w-full" />
                              <Skeleton className="h-6 w-full mt-1" />
                            </div>
                          ) : folderNotes[folder.id].length === 0 ? (
                            <p className="px-4 py-2 text-xs text-muted-foreground">No notes in this folder</p>
                          ) : (
                            folderNotes[folder.id].map((note) => (
                              <Link key={note.id} href={`/notes/${note.id}`}>
                                <div
                                  className={cn(
                                    "flex items-center rounded-md px-4 py-2 text-sm",
                                    pathname === `/notes/${note.id}`
                                      ? "bg-accent text-accent-foreground"
                                      : "hover:bg-accent/50",
                                  )}
                                >
                                  <span className="truncate">{note.title}</span>
                                </div>
                              </Link>
                            ))
                          )}
                          <Link href={`/notes/new?folder=${folder.id}`}>
                            <div className="flex items-center rounded-md px-4 py-2 text-sm text-muted-foreground hover:bg-accent/50">
                              <PlusCircle className="mr-2 h-3 w-3" />
                              <span>New Note</span>
                            </div>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <Separator />
          <div>
            <h3 className="mb-2 px-4 text-sm font-medium">Features</h3>
            <div className="space-y-1">
              <Link href="/memes">
                <div
                  className={cn(
                    "flex items-center rounded-md px-4 py-2 text-sm",
                    pathname.startsWith("/memes") ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                  )}
                >
                  <ImageIcon className="mr-2 h-4 w-4" />
                  <span>Meme Generator</span>
                </div>
              </Link>
              <Link href="/billing">
                <div
                  className={cn(
                    "flex items-center rounded-md px-4 py-2 text-sm",
                    pathname === "/billing" ? "bg-accent text-accent-foreground" : "hover:bg-accent/50",
                  )}
                >
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Billing</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
