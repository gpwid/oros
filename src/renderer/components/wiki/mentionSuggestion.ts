import { ReactRenderer } from '@tiptap/react'
import tippy, { Instance } from 'tippy.js'
import { useWorldStore } from '../../store/useWorldStore'
import { LoreEntity } from '@shared/types'

export interface MentionItem {
  id: string;
  title: string;
  type: string;
  avatar?: string;
}

// React component for the mention dropdown list
class MentionList {
  element: HTMLDivElement;
  items: MentionItem[] = [];
  selectedIndex = 0;
  command: (item: { id: string; label: string }) => void = () => {};

  constructor() {
    this.element = document.createElement('div')
    this.element.className = 'oros-mention-popover bg-oros-900 border border-oros-750 rounded-[4px] shadow-2xl p-1 w-64 max-h-60 overflow-y-auto space-y-0.5 z-50 text-xs backdrop-blur-md select-none'
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
        this.command({ id: item.id, label: item.title })
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
      empty.textContent = 'No matching lore found'
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
          <div class="w-5 h-5 rounded-[2px] ${isSelected ? 'bg-accent text-accent-contrast' : 'bg-oros-950 text-oros-400 border border-oros-800'} flex items-center justify-center font-bold text-[10px] shrink-0 font-mono">
            ${item.title.charAt(0)}
          </div>
          <span class="truncate">${item.title}</span>
        </div>
        <span class="text-[9px] uppercase font-mono px-1 py-0.2 rounded-[2px] ${isSelected ? 'bg-accent/20 text-accent font-medium' : 'bg-oros-950 text-oros-400 border border-oros-800/80'} shrink-0">${item.type}</span>
      `
      btn.addEventListener('click', () => {
        this.command({ id: item.id, label: item.title })
      })
      this.element.appendChild(btn)
    })
  }

  destroy() {
    this.element.remove()
  }
}

export const createMentionSuggestion = () => ({
  items: ({ query }: { query: string }): MentionItem[] => {
    const { entities, activeWorldId } = useWorldStore.getState()
    const list = activeWorldId ? entities[activeWorldId] || [] : []
    return list
      .filter((e) => e.title.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 8)
      .map((e) => ({
        id: e.id,
        title: e.title,
        type: e.type,
        avatar: e.avatar
      }))
  },

  render: () => {
    let component: MentionList
    let popup: Instance[]

    return {
      onStart: (props: any) => {
        component = new MentionList()
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
