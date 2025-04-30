import { NoteEditor } from "@/components/notes/note-editor"

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to Family Notes</h2>
        <p className="text-muted-foreground">Create a new note or select an existing note from the sidebar.</p>
      </div>
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Create a New Note</h3>
        <NoteEditor />
      </div>
    </div>
  )
}
