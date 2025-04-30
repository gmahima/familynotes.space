import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { NoteEditor } from "@/components/notes/note-editor"

export default async function DashboardPage() {
  const supabase = createServerClient()

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to Family Notes</h2>
        <p className="text-muted-foreground">Create a new note or select an existing note from the sidebar.</p>
      </div>
      <div className="border rounded-lg p-6">
        <NoteEditor />
      </div>
    </div>
  )
}
