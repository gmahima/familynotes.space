"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Edit, Trash2, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import type { MemeTemplate } from "@/types"

interface TemplateCardProps {
  template: MemeTemplate
  onSelect: (template: MemeTemplate) => void
  onDelete?: (template: MemeTemplate) => void
  onEdit?: (template: MemeTemplate) => void
  isOwner?: boolean
}

export function TemplateCard({ template, onSelect, onDelete, onEdit, isOwner = false }: TemplateCardProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!isOwner) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/memes/templates/${template.id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete template")
      }

      toast({
        title: "Template deleted",
        description: "The meme template has been deleted successfully.",
      })

      if (onDelete) {
        onDelete(template)
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast({
        title: "Error",
        description: "Failed to delete the template. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video overflow-hidden">
        <Image
          src={template.image_url || "/placeholder.svg?height=400&width=600&query=meme template"}
          alt={template.name}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-medium truncate">{template.name}</h3>
      </CardContent>
      <CardFooter className="flex justify-between p-4 pt-0">
        <Button variant="outline" size="sm" onClick={() => onSelect(template)}>
          Use Template
        </Button>
        {isOwner && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit && onEdit(template)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardFooter>
    </Card>
  )
}
