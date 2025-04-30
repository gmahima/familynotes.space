import { Extension } from "@tiptap/core"
import { Plugin, PluginKey } from "prosemirror-state"

export interface SpeechToTextOptions {
  onStart?: () => void
  onStop?: () => void
  onError?: (error: Error) => void
  onTranscribing?: (isTranscribing: boolean) => void
}

export const SpeechToText = Extension.create<SpeechToTextOptions>({
  name: "speechToText",

  addOptions() {
    return {
      onStart: () => {},
      onStop: () => {},
      onError: () => {},
      onTranscribing: () => {},
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("speechToText"),
        props: {
          handleDOMEvents: {
            // This is just a placeholder, the actual recording functionality
            // will be handled by the RecordButton component
          },
        },
      }),
    ]
  },
})
