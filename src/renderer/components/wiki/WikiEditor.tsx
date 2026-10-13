import React, { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, 
  List, ListOrdered, Quote, Undo, Redo 
} from 'lucide-react'

interface WikiEditorProps {
  content: string;
  onChange: (newContent: string) => void;
  placeholder?: string;
}

export const WikiEditor: React.FC<WikiEditorProps> = ({ 
  content, onChange, placeholder = 'Chronicle lore, history, or knowledge...' 
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder
      })
    ],
    content,
    editorProps: {
      attributes: {
        class: 'oros-wiki-prose focus:outline-none min-h-[360px] p-4 text-slate-200 select-text'
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

  if (!editor) return null

  return (
    <div className="border border-oros-800 rounded-xl bg-oros-950/70 overflow-hidden shadow-inner">
      {/* Editor Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-oros-900/80 border-b border-oros-800 text-oros-300">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('bold') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Bold"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('italic') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Italic"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('strike') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Strikethrough"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-oros-700/60 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('heading', { level: 1 }) ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Heading 1"
        >
          <Heading1 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('heading', { level: 2 }) ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Heading 2"
        >
          <Heading2 className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('heading', { level: 3 }) ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Heading 3"
        >
          <Heading3 className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-oros-700/60 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('bulletList') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Bullet List"
        >
          <List className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('orderedList') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Numbered List"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-1.5 rounded hover:bg-oros-800 ${editor.isActive('blockquote') ? 'text-gold-400 bg-oros-800' : ''}`}
          title="Blockquote"
        >
          <Quote className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-4 bg-oros-700/60 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded hover:bg-oros-800 disabled:opacity-30"
          title="Undo"
        >
          <Undo className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded hover:bg-oros-800 disabled:opacity-30"
          title="Redo"
        >
          <Redo className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  )
}
