import { notFound, redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { NoteEditor } from "@/components/notes/note-editor"

export default async function NotePage({ params }: { params: { id: string } }) {
  const supabase = createServerClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Handle "new" as a special case
  if (params.id === "new") {
    return (
      <div className="space-y-6">
        <div className="border rounded-lg p-6">
          <NoteEditor />
        </div>
      </div>
    )
  }

  // Fetch the note
  const { data: note, error } = await supabase
    .from("notes")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !note) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div className="border rounded-lg p-6">
        <NoteEditor
          noteId={note.id}
          initialTitle={note.title}
          initialContent={note.content || ""}
          initialFolderId={note.folder_id || ""}
        />
      </div>
    </div>
  )
}
