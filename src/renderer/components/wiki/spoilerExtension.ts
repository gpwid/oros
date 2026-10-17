import { Mark, mergeAttributes, markInputRule, markPasteRule } from '@tiptap/react'

export interface SpoilerOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/react' {
  interface Commands<ReturnType> {
    spoiler: {
      /**
       * Set a spoiler mark
       */
      setSpoiler: () => ReturnType;
      /**
       * Toggle a spoiler mark
       */
      toggleSpoiler: () => ReturnType;
      /**
       * Unset a spoiler mark
       */
      unsetSpoiler: () => ReturnType;
    };
  }
}

export const Spoiler = Mark.create<SpoilerOptions>({
  name: 'spoiler',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'oros-spoiler',
        'data-spoiler': 'true'
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span.oros-spoiler'
      },
      {
        tag: 'span[data-spoiler]'
      },
      {
        tag: 'spoiler'
      }
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0]
  },

  addCommands() {
    return {
      setSpoiler: () => ({ commands }) => {
        return commands.setMark(this.name)
      },
      toggleSpoiler: () => ({ commands }) => {
        return commands.toggleMark(this.name)
      },
      unsetSpoiler: () => ({ commands }) => {
        return commands.unsetMark(this.name)
      }
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Shift-s': () => this.editor.commands.toggleSpoiler(),
      'Mod-Alt-s': () => this.editor.commands.toggleSpoiler()
    }
  },

  addInputRules() {
    return [
      markInputRule({
        find: /(?:\|\|)([^|]+)(?:\|\|)$/,
        type: this.type
      })
    ]
  },

  addPasteRules() {
    return [
      markPasteRule({
        find: /(?:\|\|)([^|]+)(?:\|\|)/g,
        type: this.type
      })
    ]
  }
})
