"use client"

import { useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { Bold, Italic, List, ListOrdered, Heading2, Heading3, Code, Quote } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { RecordButton } from "./record-button"
import { SpeechToText } from "./speech-to-text-extension"

interface TipTapEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function TipTapEditor({ content, onChange, placeholder = "Write something..." }: TipTapEditorProps) {
  const [isTranscribing, setIsTranscribing] = useState(false)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      SpeechToText.configure({
        onTranscribing: setIsTranscribing,
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editable: !isTranscribing,
  })

  if (!editor) {
    return null
  }

  const handleTranscriptionComplete = (text: string) => {
    // Insert the transcribed text at the current cursor position
    editor.commands.insertContent(text)
  }

  return (
    <div className={cn("border rounded-md", isTranscribing && "bg-muted/20")}>
      <div className="flex flex-wrap gap-1 p-1 border-b bg-muted/20 justify-between">
        <div className="flex flex-wrap gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 px-2", editor.isActive("bold") ? "bg-muted" : "")}
            aria-label="Bold"
            disabled={isTranscribing}
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 px-2", editor.isActive("italic") ? "bg-muted" : "")}
            aria-label="Italic"
            disabled={isTranscribing}
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn("h-8 px-2", editor.isActive("heading", { level: 2 }) ? "bg-muted" : "")}
            aria-label="Heading 2"
            disabled={isTranscribing}
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={cn("h-8 px-2", editor.isActive("heading", { level: 3 }) ? "bg-muted" : "")}
            aria-label="Heading 3"
            disabled={isTranscribing}
          >
            <Heading3 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 px-2", editor.isActive("bulletList") ? "bg-muted" : "")}
            aria-label="Bullet List"
            disabled={isTranscribing}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 px-2", editor.isActive("orderedList") ? "bg-muted" : "")}
            aria-label="Ordered List"
            disabled={isTranscribing}
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn("h-8 px-2", editor.isActive("codeBlock") ? "bg-muted" : "")}
            aria-label="Code Block"
            disabled={isTranscribing}
          >
            <Code className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn("h-8 px-2", editor.isActive("blockquote") ? "bg-muted" : "")}
            aria-label="Quote"
            disabled={isTranscribing}
          >
            <Quote className="h-4 w-4" />
          </Button>
        </div>
        <RecordButton
          onTranscriptionComplete={handleTranscriptionComplete}
          onTranscribing={setIsTranscribing}
          disabled={isTranscribing}
        />
      </div>
      <div className={cn("relative", isTranscribing && "opacity-50")}>
        {isTranscribing && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 z-10">
            <div className="text-center">
              <div className="text-lg font-medium">Transcribing...</div>
              <div className="text-sm text-muted-foreground">Please wait while we process your audio</div>
            </div>
          </div>
        )}
        <EditorContent editor={editor} className="prose prose-sm max-w-none p-4 focus:outline-none min-h-[200px]" />
      </div>
    </div>
  )
}
