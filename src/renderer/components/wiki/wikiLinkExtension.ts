import { Node, mergeAttributes, nodeInputRule } from '@tiptap/react'
import Suggestion, { SuggestionOptions, SuggestionPluginKey } from '@tiptap/suggestion'
import tippy, { Instance } from 'tippy.js'
import { useWorldStore } from '../../store/useWorldStore'
import { resolveEntityFromLink } from '../../utils/proseProcessor'

export interface WikiLinkItem {
  id: string;
  title: string;
  type: string;
  avatar?: string;
  aliases?: string[];
}

export const WikiLinkPluginKey = new (SuggestionPluginKey as any).constructor('wikiLinkSuggestion')

// Dropdown suggestion list for [[query]] wiki linking
class WikiLinkList {
  element: HTMLDivElement;
  items: WikiLinkItem[] = [];
  selectedIndex = 0;
  command: (item: { id: string; title: string }) => void = () => {};

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'oros-wiki-link-popover bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-1 w-64 max-h-60 overflow-y-auto space-y-0.5 z-50 text-xs backdrop-blur-md select-none'
  }

  updateProps(props: any) {
    this.items = props.items || []
    this.command = props.command
    this.selectedIndex = 0
    this.render()
  }

  onKeyDown({ event }: { event: KeyboardEvent }) {
    if (event.key === 'ArrowUp') {
      this.selectedIndex = (this.selectedIndex - 1 + this.items.length) % Math.max(this.items.length, 1)
      this.render()
      return true
    }
    if (event.key === 'ArrowDown') {
      this.selectedIndex = (this.selectedIndex + 1) % Math.max(this.items.length, 1)
      this.render()
      return true
    }
    if (event.key === 'Enter') {
      if (this.items[this.selectedIndex]) {
        const item = this.items[this.selectedIndex]
        this.command({ id: item.id, title: item.title })
      }
      return true
    }
    return false
  }

  render() {
    this.element.innerHTML = ''
    if (this.items.length === 0) {
      const empty = document.createElement('div')
      empty.className = 'p-2 text-center text-oros-500 italic text-[11px]'
      empty.textContent = 'No matching lore or alias found'
      this.element.appendChild(empty)
      return
    }

    this.items.forEach((item, index) => {
      const btn = document.createElement('button')
      const isSelected = index === this.selectedIndex
      btn.className = `w-full text-left p-1.5 rounded-[3px] flex items-center justify-between transition-colors border ${
        isSelected 
          ? 'bg-accent-muted text-oros-100 font-medium border-accent/40 shadow-sm' 
          : 'text-oros-300 hover:bg-oros-850 hover:text-oros-100 border-transparent'
      }`
      btn.innerHTML = `
        <div class="flex items-center gap-2 truncate mr-1">
          <div class="w-5 h-5 rounded-[2px] ${isSelected ? 'btn-accent' : 'bg-oros-950 text-oros-400 border border-oros-800'} flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
            ${item.title.charAt(0)}
          </div>
          <span class="truncate">${item.title}</span>
        </div>
        <span class="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[2px] ${isSelected ? 'bg-accent/20 text-accent font-medium' : 'bg-oros-950 text-oros-400 border border-oros-800/80'} shrink-0">${item.type}</span>
      `
      btn.addEventListener('click', () => {
        this.command({ id: item.id, title: item.title })
      })
      this.element.appendChild(btn)
    })
  }

  destroy() {
    this.element.remove()
  }
}

export const createWikiLinkSuggestion = (): Omit<SuggestionOptions, 'editor'> => ({
  char: '[[',
  pluginKey: WikiLinkPluginKey,
  allowSpaces: true,
  findSuggestionMatch: (config) => {
    const { $position } = config
    const text = $position.nodeBefore?.isText && $position.nodeBefore.text
    if (!text) return null

    // Custom regex matcher matching [[query at line start or preceded by whitespace
    const regex = /(?:^|\s)\[\[([^\]]*)$/
    const match = regex.exec(text)
    if (!match) return null

    const matchStr = match[0]
    const triggerIdx = matchStr.indexOf('[[')
    const textFrom = $position.pos - text.length
    const from = textFrom + match.index + triggerIdx
    const to = $position.pos

    return {
      range: { from, to },
      query: match[1],
      text: text.slice(match.index + triggerIdx)
    }
  },
  items: ({ query }: { query: string }) => {
    const { entities, activeWorldId } = useWorldStore.getState()
    const list = activeWorldId ? entities[activeWorldId] || [] : []
    const q = query.toLowerCase().trim()
    if (!q) {
      return list.slice(0, 8).map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        avatar: e.avatar,
        aliases: e.aliases
      }))
    }
    return list
      .filter((e) => {
        const titleMatch = e.title.toLowerCase().includes(q)
        const aliasMatch = e.aliases?.some(a => a.toLowerCase().includes(q))
        return titleMatch || aliasMatch
      })
      .slice(0, 8)
      .map(e => ({
        id: e.id,
        title: e.title,
        type: e.type,
        avatar: e.avatar,
        aliases: e.aliases
      }))
  },
  command: ({ editor, range, props }) => {
    editor
      .chain()
      .focus()
      .insertContentAt(range, [
        {
          type: 'wikiLink',
          attrs: {
            id: props.id,
            title: props.title
          }
        },
        {
          type: 'text',
          text: ' '
        }
      ])
      .run()
  },
  render: () => {
    let component: WikiLinkList
    let popup: Instance[]

    return {
      onStart: (props: any) => {
        component = new WikiLinkList()
        component.updateProps(props)

        if (!props.clientRect) return

        popup = tippy('body', {
          getReferenceClientRect: props.clientRect,
          appendTo: () => document.body,
          content: component.element,
          showOnCreate: true,
          interactive: true,
          trigger: 'manual',
          placement: 'bottom-start'
        })
      },

      onUpdate(props: any) {
        component.updateProps(props)
        if (!props.clientRect) return
        popup[0]?.setProps({
          getReferenceClientRect: props.clientRect
        })
      },

      onKeyDown(props: any) {
        if (props.event.key === 'Escape') {
          popup[0]?.hide()
          return true
        }
        return component.onKeyDown(props)
      },

      onExit() {
        popup[0]?.destroy()
        component.destroy()
      }
    }
  }
})

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>
  suggestion: Omit<SuggestionOptions, 'editor'>
}

const WIKI_LINK_INPUT_REGEX = /\[\[([^\]|#\n]+)(?:#([^\]|\n]+))?(?:\|([^\]\n]+))?\]\]$/

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'oros-wiki-link',
        'data-type': 'wiki-link'
      },
      suggestion: createWikiLinkSuggestion()
    }
  },

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-id'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.id) return {}
          return { 'data-id': attributes.id }
        }
      },
      title: {
        default: null,
        parseHTML: (element: HTMLElement) => 
          element.getAttribute('data-title') || 
          element.getAttribute('data-label') || 
          element.textContent?.replace(/^\[\[/, '').replace(/\]\]$/, '').trim(),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.title) return {}
          return { 'data-title': attributes.title }
        }
      },
      section: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-section'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.section) return {}
          return { 'data-section': attributes.section }
        }
      },
      label: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-label'),
        renderHTML: (attributes: Record<string, any>) => {
          if (!attributes.label) return {}
          return { 'data-label': attributes.label }
        }
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wiki-link"]'
      },
      {
        tag: 'span.oros-wiki-link'
      }
    ]
  },

  renderHTML({ node, HTMLAttributes }: { node: any; HTMLAttributes: Record<string, any> }) {
    const title = (node.attrs.title || '').replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
    const section = node.attrs.section ? String(node.attrs.section).trim() : ''
    const label = node.attrs.label ? String(node.attrs.label).trim() : ''
    const displayText = label || (section ? `${title} § ${section}` : (title || 'Entity'))

    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      displayText
    ]
  },

  renderText({ node }: { node: any }) {
    const title = (node.attrs.title || '').replace(/^\[\[/, '').replace(/\]\]$/, '').trim()
    const sec = node.attrs.section ? `#${node.attrs.section}` : ''
    const lbl = node.attrs.label ? `|${node.attrs.label}` : ''
    return `[[${title}${sec}${lbl}]]`
  },

  addInputRules() {
    return [
      nodeInputRule({
        find: WIKI_LINK_INPUT_REGEX,
        type: this.type,
        getAttributes: (match) => {
          const rawTarget = (match[1] || '').trim()
          const rawSection = match[2] ? match[2].trim() : null
          const rawLabel = match[3] ? match[3].trim() : null

          const { entities, activeWorldId } = useWorldStore.getState()
          const list = activeWorldId ? entities[activeWorldId] || [] : []
          const resolved = resolveEntityFromLink(list, null, rawTarget)

          return {
            id: resolved?.id || null,
            title: resolved?.title || rawTarget,
            section: rawSection,
            label: rawLabel
          }
        }
      })
    ]
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion
      })
    ]
  }
})
