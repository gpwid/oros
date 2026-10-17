import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Mention from '@tiptap/extension-mention'
import { createMentionSuggestion } from './mentionSuggestion'
import { useToastStore } from '../../store/useToastStore'
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Undo, Redo, AtSign, Image as ImageIcon,
  EyeOff
} from 'lucide-react'
import { Spoiler } from './spoilerExtension'

interface WikiEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
}

export const WikiEditor: React.FC<WikiEditorProps> = ({ 
  content, onChange, placeholder = 'Chronicle lore, history, or knowledge... (Type @ to link lore cards, ||spoiler|| for secrets)' 
}) => {
  const { addToast } = useToastStore()

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'oros-mention'
        },
        suggestion: createMentionSuggestion()
      }),
      Spoiler
    ],
    content,
    editorProps: {
      attributes: {
        class: 'oros-wiki-prose focus:outline-none min-h-[380px] p-5 text-slate-200 select-text leading-relaxed'
      }
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    }
  })

  // Synchronize when entity selection changes externally
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content)
    }
  }, [content, editor])

  const handleInsertAsset = async () => {
    if (window.oros) {
      const assetUrl = await window.oros.importAsset()
      if (assetUrl && editor) {
        editor.chain().focus().insertContent(`<img src="${assetUrl}" alt="World Archive Art" class="rounded-xl border border-oros-700/60 my-4 max-h-96 w-auto shadow-xl" />`).run()
        addToast('Asset imported into local vault', 'success')
      }
    } else {
      addToast('Local asset importer requires desktop app', 'warning')
    }
  }

  if (!editor) return null

  return (
    <div className="border border-oros-750 rounded-[4px] bg-oros-950/70 overflow-hidden shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-1.5 bg-oros-900 border-b border-oros-750 text-oros-300">
        <div className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('bold') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Bold (Ctrl+B)"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('italic') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Italic (Ctrl+I)"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('strike') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-oros-750 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('heading', { level: 1 }) ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('heading', { level: 2 }) ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('heading', { level: 3 }) ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Heading 3"
          >
            <Heading3 className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-oros-750 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('bulletList') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('orderedList') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Numbered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-1.5 rounded-[3px] transition-colors ${editor.isActive('blockquote') ? 'text-accent bg-accent-muted border border-accent/30 font-medium' : 'hover:bg-oros-850 hover:text-oros-100 text-oros-400 border border-transparent'}`}
            title="Blockquote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-oros-750 mx-1" />

          {/* Contextual Mention Shortcut */}
          <button
            type="button"
            onClick={() => editor.chain().focus().insertContent(' @').run()}
            className="px-2 py-1 rounded-[3px] bg-accent-muted hover:bg-accent text-accent hover:text-accent-contrast border border-accent/40 text-xs font-semibold flex items-center gap-1 transition-colors shadow-sm"
            title="Mention World Entity (@)"
          >
            <AtSign className="w-3.5 h-3.5" />
            <span className="text-[11px]">Mention</span>
          </button>

          {/* Local Image Importer */}
          <button
            type="button"
            onClick={handleInsertAsset}
            className="px-2 py-1 rounded-[3px] bg-oros-950 border border-oros-750 hover:bg-oros-850 text-oros-200 text-xs flex items-center gap-1 transition-colors"
            title="Import Local Artwork to Vault"
          >
            <ImageIcon className="w-3.5 h-3.5 text-teal-400" />
            <span className="text-[11px]">Add Art</span>
          </button>

          {/* Discord-style Spoiler Mark */}
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleSpoiler().run()}
            className={`px-2 py-1 rounded-[3px] border text-xs flex items-center gap-1 transition-colors ${
              editor.isActive('spoiler')
                ? 'bg-rose-950/80 border-rose-700/80 text-rose-300'
                : 'bg-oros-950 border-oros-750 hover:bg-rose-950/40 hover:text-rose-300 text-oros-300'
            }`}
            title="Spoiler Tag (Ctrl+Shift+S or type ||secret||)"
          >
            <EyeOff className="w-3.5 h-3.5 text-rose-400" />
            <span className="text-[11px]">Spoiler</span>
          </button>
        </div>

        <div className="flex items-center gap-1 text-oros-400">
          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-[3px] hover:bg-oros-850 hover:text-oros-100 disabled:opacity-30"
            title="Undo (Ctrl+Z)"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-[3px] hover:bg-oros-850 hover:text-oros-100 disabled:opacity-30"
            title="Redo (Ctrl+Y)"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  )
}
