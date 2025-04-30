"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"

interface FolderFormProps {
  folderId?: string
  initialName?: string
}

export function FolderForm({ folderId, initialName = "" }: FolderFormProps) {
  const router = useRouter()
  const [name, setName] = useState(initialName)
  const [loading, setLoading] = useState(false)

  const saveFolder = async () => {
    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your folder",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("User not authenticated")
      }

      const folderData = {
        name,
        user_id: user.id,
      }

      let result

      if (folderId) {
        // Update existing folder
        result = await supabase.from("folders").update(folderData).eq("id", folderId)
      } else {
        // Create new folder
        result = await supabase.from("folders").insert(folderData)
      }

      if (result.error) throw result.error

      toast({
        title: folderId ? "Folder updated" : "Folder created",
        description: folderId ? "Your folder has been updated" : "Your new folder has been created",
      })

      router.push("/dashboard")
      router.refresh()
    } catch (error) {
      console.error("Error saving folder:", error)
      toast({
        title: "Error",
        description: "There was a problem saving your folder",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Folder Name</Label>
        <Input id="name" placeholder="Enter folder name" value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button onClick={saveFolder} disabled={loading}>
          {folderId ? "Update Folder" : "Create Folder"}
        </Button>
      </div>
    </div>
  )
}
