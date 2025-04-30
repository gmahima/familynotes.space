import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase-server"
import { FolderForm } from "@/components/folders/folder-form"

export default async function NewFolderPage() {
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
      <h2 className="text-2xl font-bold tracking-tight">Create New Folder</h2>
      <div className="border rounded-lg p-6 max-w-md">
        <FolderForm />
      </div>
    </div>
  )
}
