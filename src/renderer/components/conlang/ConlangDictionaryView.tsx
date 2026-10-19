import React, { useState, useMemo } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { confirmDialog } from '../../store/useConfirmStore'
import { ConlangLanguage, ConlangWord, ConlangPartOfSpeech } from '@shared/types'
import { 
  Languages, Plus, Search, Trash2, Edit2, BookA, 
  Volume2, Compass, Tag, Copy, Check, Filter, X, ArrowUpDown, ExternalLink
} from 'lucide-react'

const PARTS_OF_SPEECH: { value: ConlangPartOfSpeech; label: string; color: string }[] = [
  { value: 'noun', label: 'Noun', color: 'bg-sky-500/10 text-sky-400 border-sky-500/30' },
  { value: 'verb', label: 'Verb', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { value: 'adjective', label: 'Adjective', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { value: 'adverb', label: 'Adverb', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { value: 'honorific', label: 'Honorific', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
  { value: 'idiom', label: 'Idiom / Cant', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { value: 'phrase', label: 'Phrase', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { value: 'pronoun', label: 'Pronoun', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  { value: 'preposition', label: 'Preposition', color: 'bg-slate-500/10 text-slate-400 border-slate-500/30' },
  { value: 'particle', label: 'Particle', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' }
]

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export const ConlangDictionaryView: React.FC = () => {
  const { 
    activeWorldId, conlangs, selectedLanguageId, setSelectedLanguageId,
    createLanguage, updateLanguage, deleteLanguage,
    addWord, updateWord, deleteWord,
    entities, openTab
  } = useWorldStore()

  const { addToast } = useToastStore()

  const worldId = activeWorldId || 'world-ostergard'
  const worldLanguages = conlangs[worldId] || []
  const activeLanguage = worldLanguages.find(l => l.id === selectedLanguageId) || worldLanguages[0]
  const worldEntities = entities[worldId] || []

  // UI state
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null)
  const [selectedPos, setSelectedPos] = useState<ConlangPartOfSpeech | 'all'>('all')
  const [sortOrder, setSortOrder] = useState<'alpha-asc' | 'alpha-desc' | 'recent'>('alpha-asc')
  const [copiedWordId, setCopiedWordId] = useState<string | null>(null)

  // Word Modal state
  const [showWordModal, setShowWordModal] = useState(false)
  const [editingWord, setEditingWord] = useState<ConlangWord | null>(null)
  const [wordTerm, setWordTerm] = useState('')
  const [wordPhonetic, setWordPhonetic] = useState('')
  const [wordPos, setWordPos] = useState<ConlangPartOfSpeech>('noun')
  const [wordDefinition, setWordDefinition] = useState('')
  const [wordEtymology, setWordEtymology] = useState('')
  const [wordAliases, setWordAliases] = useState('')
  const [wordExampleOriginal, setWordExampleOriginal] = useState('')
  const [wordExampleTranslation, setWordExampleTranslation] = useState('')
  const [wordRelatedEntityId, setWordRelatedEntityId] = useState('')

  // Language Modal state
  const [showLangModal, setShowLangModal] = useState(false)
  const [editingLang, setEditingLang] = useState<ConlangLanguage | null>(null)
  const [langName, setLangName] = useState('')
  const [langFamily, setLangFamily] = useState('')
  const [langDescription, setLangDescription] = useState('')
  const [langWritingSystem, setLangWritingSystem] = useState('')
  const [langColor, setLangColor] = useState('#38bdf8')

  // Filtered & Sorted Words
  const filteredWords = useMemo(() => {
    if (!activeLanguage) return []
    let list = [...activeLanguage.words]

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(w => 
        w.term.toLowerCase().includes(q) ||
        w.definition.toLowerCase().includes(q) ||
        (w.phonetic && w.phonetic.toLowerCase().includes(q)) ||
        (w.etymology && w.etymology.toLowerCase().includes(q)) ||
        (w.aliases && w.aliases.some(a => a.toLowerCase().includes(q)))
      )
    }

    // Letter filter
    if (selectedLetter) {
      list = list.filter(w => w.term.toUpperCase().startsWith(selectedLetter))
    }

    // Part of speech filter
    if (selectedPos !== 'all') {
      list = list.filter(w => w.partOfSpeech === selectedPos)
    }

    // Sort order
    list.sort((a, b) => {
      if (sortOrder === 'alpha-asc') return a.term.localeCompare(b.term)
      if (sortOrder === 'alpha-desc') return b.term.localeCompare(a.term)
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    })

    return list
  }, [activeLanguage, searchQuery, selectedLetter, selectedPos, sortOrder])

  // Open Add Word Modal
  const handleOpenAddWord = () => {
    setEditingWord(null)
    setWordTerm('')
    setWordPhonetic('')
    setWordPos('noun')
    setWordDefinition('')
    setWordEtymology('')
    setWordAliases('')
    setWordExampleOriginal('')
    setWordExampleTranslation('')
    setWordRelatedEntityId('')
    setShowWordModal(true)
  }

  // Open Edit Word Modal
  const handleOpenEditWord = (word: ConlangWord) => {
    setEditingWord(word)
    setWordTerm(word.term)
    setWordPhonetic(word.phonetic || '')
    setWordPos(word.partOfSpeech)
    setWordDefinition(word.definition)
    setWordEtymology(word.etymology || '')
    setWordAliases(word.aliases ? word.aliases.join(', ') : '')
    setWordExampleOriginal(word.examples?.[0]?.original || '')
    setWordExampleTranslation(word.examples?.[0]?.translation || '')
    setWordRelatedEntityId(word.relatedEntityId || '')
    setShowWordModal(true)
  }

  // Submit Word
  const handleWordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeLanguage) return
    if (!wordTerm.trim()) {
      addToast('Word term is required', 'error')
      return
    }

    const aliasesArray = wordAliases
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const examples = wordExampleOriginal.trim()
      ? [{ original: wordExampleOriginal.trim(), translation: wordExampleTranslation.trim() }]
      : undefined

    if (editingWord) {
      updateWord(activeLanguage.id, editingWord.id, {
        term: wordTerm.trim(),
        phonetic: wordPhonetic.trim() || undefined,
        partOfSpeech: wordPos,
        definition: wordDefinition.trim(),
        etymology: wordEtymology.trim() || undefined,
        aliases: aliasesArray.length > 0 ? aliasesArray : undefined,
        examples,
        relatedEntityId: wordRelatedEntityId || undefined
      })
      addToast(`Updated term: ${wordTerm.trim()}`, 'success')
    } else {
      addWord(activeLanguage.id, {
        term: wordTerm.trim(),
        phonetic: wordPhonetic.trim() || undefined,
        partOfSpeech: wordPos,
        definition: wordDefinition.trim(),
        etymology: wordEtymology.trim() || undefined,
        aliases: aliasesArray.length > 0 ? aliasesArray : undefined,
        examples,
        relatedEntityId: wordRelatedEntityId || undefined
      })
      addToast(`Added term: ${wordTerm.trim()}`, 'success')
    }

    setShowWordModal(false)
  }

  // Delete Word
  const handleDeleteWord = async (word: ConlangWord) => {
    const ok = await confirmDialog({
      title: 'Delete Lexicon Term',
      message: `Are you sure you want to delete "${word.term}" from ${activeLanguage?.name}?`,
      confirmText: 'Delete Term',
      variant: 'danger'
    })
    if (ok && activeLanguage) {
      deleteWord(activeLanguage.id, word.id)
      addToast(`Deleted "${word.term}"`, 'info')
    }
  }

  // Copy Term to clipboard
  const handleCopyTerm = (word: ConlangWord) => {
    navigator.clipboard.writeText(word.term)
    setCopiedWordId(word.id)
    setTimeout(() => setCopiedWordId(null), 1500)
    addToast(`Copied "${word.term}"`, 'info')
  }

  // Open Language Modal
  const handleOpenAddLang = () => {
    setEditingLang(null)
    setLangName('')
    setLangFamily('')
    setLangDescription('')
    setLangWritingSystem('')
    setLangColor('#38bdf8')
    setShowLangModal(true)
  }

  const handleOpenEditLang = (lang: ConlangLanguage) => {
    setEditingLang(lang)
    setLangName(lang.name)
    setLangFamily(lang.family || '')
    setLangDescription(lang.description)
    setLangWritingSystem(lang.writingSystem || '')
    setLangColor(lang.color || '#38bdf8')
    setShowLangModal(true)
  }

  // Submit Language
  const handleLangSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!langName.trim()) {
      addToast('Language name is required', 'error')
      return
    }

    if (editingLang) {
      updateLanguage(editingLang.id, {
        name: langName.trim(),
        family: langFamily.trim() || undefined,
        description: langDescription.trim(),
        writingSystem: langWritingSystem.trim() || undefined,
        color: langColor
      })
      addToast(`Updated language: ${langName.trim()}`, 'success')
    } else {
      const created = createLanguage(langName.trim(), langDescription.trim(), langFamily.trim(), langColor)
      setSelectedLanguageId(created.id)
      addToast(`Created language: ${langName.trim()}`, 'success')
    }

    setShowLangModal(false)
  }

  // Delete Language
  const handleDeleteLang = async (lang: ConlangLanguage) => {
    const ok = await confirmDialog({
      title: 'Delete Constructed Language',
      message: `Delete language "${lang.name}" and all ${lang.words.length} terms in its lexicon?`,
      confirmText: 'Delete Language',
      variant: 'danger'
    })
    if (ok) {
      deleteLanguage(lang.id)
      addToast(`Deleted language "${lang.name}"`, 'info')
    }
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-oros-950 text-oros-100 overflow-hidden font-sans">
      {/* Top Banner & Language Selector Bar */}
      {/* Header */}
      <header className="shrink-0 bg-oros-900/60 border-b border-oros-800 px-6 py-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[3px] bg-accent-muted border border-accent/40 flex items-center justify-center text-accent shadow-sm shrink-0">
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                {worldLanguages.length > 1 ? (
                  <div className="flex items-center gap-1.5">
                    <select
                      value={activeLanguage?.id || ''}
                      onChange={(e) => setSelectedLanguageId(e.target.value)}
                      className="bg-oros-950 border border-oros-750 rounded-[3px] px-2.5 py-1 text-sm font-serif font-bold text-oros-100 focus:outline-none focus:border-accent cursor-pointer"
                    >
                      {worldLanguages.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name} ({l.words.length} terms)
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <h1 className="font-serif text-lg font-bold tracking-tight text-oros-100">
                    {activeLanguage?.name || 'World Lexicon & Constructed Languages'}
                  </h1>
                )}
                {activeLanguage?.family && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-oros-850 border border-oros-800 text-oros-400">
                    {activeLanguage.family}
                  </span>
                )}
                {activeLanguage?.writingSystem && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-[3px] bg-oros-850 border border-oros-800 text-oros-500 hidden sm:inline">
                    Script: {activeLanguage.writingSystem}
                  </span>
                )}
              </div>
              <p className="text-xs text-oros-400 max-w-2xl mt-0.5 line-clamp-1">
                {activeLanguage?.description || 'Track setting idioms, conlangs, phonetics, and auto-gloss prose translations.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeLanguage && (
              <button
                onClick={() => handleOpenEditLang(activeLanguage)}
                className="px-2.5 py-1.5 rounded-[3px] text-xs font-medium border border-oros-800 bg-oros-900 text-oros-300 hover:text-oros-100 hover:bg-oros-850 flex items-center gap-1.5 transition-colors"
                title="Edit language settings"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Configure</span>
              </button>
            )}

            <button
              onClick={handleOpenAddLang}
              className="px-2.5 py-1.5 rounded-[3px] text-xs font-medium border border-oros-800 bg-oros-900 text-oros-300 hover:text-oros-100 hover:bg-oros-850 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Language</span>
            </button>

            <button
              onClick={handleOpenAddWord}
              disabled={!activeLanguage}
              className="px-3 py-1.5 rounded-[3px] text-xs font-semibold bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Term</span>
            </button>
          </div>
        </div>
      </header>

      {/* Control Filter Toolbar */}
      <div className="shrink-0 bg-oros-900/30 border-b border-oros-800/80 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Search className="w-3.5 h-3.5 text-oros-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search words, meanings, phonetics, roots..."
            className="w-full bg-oros-950 border border-oros-800 rounded-[3px] pl-8 pr-7 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-oros-500 hover:text-oros-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Center: Part of Speech Filter */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-xl scrollbar-none">
          <button
            onClick={() => setSelectedPos('all')}
            className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors ${
              selectedPos === 'all'
                ? 'bg-oros-800 text-oros-100 font-semibold'
                : 'text-oros-500 hover:text-oros-300'
            }`}
          >
            All POS
          </button>
          {PARTS_OF_SPEECH.slice(0, 6).map(pos => (
            <button
              key={pos.value}
              onClick={() => setSelectedPos(selectedPos === pos.value ? 'all' : pos.value)}
              className={`px-2 py-0.5 rounded-[3px] text-[11px] font-mono transition-colors ${
                selectedPos === pos.value
                  ? 'bg-accent-muted text-accent font-semibold border border-accent/40'
                  : 'text-oros-400 hover:text-oros-200'
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>

        {/* Right: Sort controls & Word count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-oros-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-oros-500" />
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1 text-xs text-oros-300 focus:outline-none focus:border-accent"
            >
              <option value="alpha-asc">A → Z</option>
              <option value="alpha-desc">Z → A</option>
              <option value="recent">Recently Updated</option>
            </select>
          </div>

          <span className="text-[11px] font-mono text-oros-500 px-2 py-0.5 rounded bg-oros-900 border border-oros-800">
            {filteredWords.length} {filteredWords.length === 1 ? 'term' : 'terms'}
          </span>
        </div>
      </div>

      {/* Alphabet Jump Bar */}
      <div className="shrink-0 bg-oros-950/80 border-b border-oros-800/60 px-6 py-1.5 flex items-center justify-between text-[11px] font-mono">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none w-full">
          <button
            onClick={() => setSelectedLetter(null)}
            className={`px-1.5 py-0.5 rounded transition-colors ${
              selectedLetter === null
                ? 'bg-oros-800 text-oros-100 font-bold'
                : 'text-oros-500 hover:text-oros-300'
            }`}
          >
            ALL
          </button>
          {ALPHABET.map(letter => {
            const hasWords = (activeLanguage?.words || []).some(w => w.term.toUpperCase().startsWith(letter))
            const isSelected = selectedLetter === letter
            return (
              <button
                key={letter}
                disabled={!hasWords}
                onClick={() => setSelectedLetter(isSelected ? null : letter)}
                className={`w-5 h-5 flex items-center justify-center rounded transition-colors ${
                  isSelected
                    ? 'bg-accent text-accent-contrast font-bold shadow-sm'
                    : hasWords
                    ? 'text-oros-300 hover:text-oros-100 hover:bg-oros-850'
                    : 'text-oros-700/60 cursor-not-allowed'
                }`}
              >
                {letter}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Lexicon Directory Canvas */}
      <main className="flex-1 overflow-y-auto px-6 py-5">
        {filteredWords.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-oros-800/80 rounded-[4px] bg-oros-900/20">
            <BookA className="w-10 h-10 text-oros-600 mb-3" />
            <h3 className="font-serif text-base font-semibold text-oros-200">
              No matching lexicon entries found
            </h3>
            <p className="text-xs text-oros-400 max-w-sm mt-1">
              {searchQuery || selectedLetter || selectedPos !== 'all'
                ? 'Try clearing active search filters or selecting another letter.'
                : 'Begin recording the idioms, conlang vocabulary, and phonetics of your realm.'}
            </p>
            <button
              onClick={handleOpenAddWord}
              className="mt-4 px-3 py-1.5 rounded-[3px] text-xs font-semibold bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record First Word</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredWords.map(word => {
              const posMeta = PARTS_OF_SPEECH.find(p => p.value === word.partOfSpeech)
              const relatedEntity = word.relatedEntityId ? worldEntities.find(e => e.id === word.relatedEntityId) : null
              const isCopied = copiedWordId === word.id

              return (
                <div
                  key={word.id}
                  className="group relative bg-oros-900/40 hover:bg-oros-900/70 border border-oros-800 hover:border-oros-700 rounded-[4px] p-4 transition-all duration-150 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Term, Phonetics, POS */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <h4 className="font-serif text-base font-bold text-oros-100 tracking-wide group-hover:text-accent transition-colors">
                            {word.term}
                          </h4>
                          {word.phonetic && (
                            <span className="font-mono text-xs text-oros-400 bg-oros-950/70 px-1.5 py-0.5 rounded border border-oros-850">
                              {word.phonetic}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded-[2px] border ${posMeta?.color || 'text-oros-400 bg-oros-850 border-oros-800'}`}>
                            {posMeta?.label || word.partOfSpeech}
                          </span>
                          {word.aliases && word.aliases.length > 0 && (
                            <span className="text-[10px] text-oros-500 font-mono truncate">
                              pl/alt: {word.aliases.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                        <button
                          onClick={() => handleCopyTerm(word)}
                          title="Copy word"
                          className="p-1 rounded text-oros-400 hover:text-oros-200 hover:bg-oros-800 transition-colors"
                        >
                          {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={() => handleOpenEditWord(word)}
                          title="Edit term"
                          className="p-1 rounded text-oros-400 hover:text-oros-200 hover:bg-oros-800 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteWord(word)}
                          title="Delete term"
                          className="p-1 rounded text-oros-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Definition */}
                    <p className="text-xs text-oros-200 mt-2.5 leading-relaxed font-sans">
                      {word.definition}
                    </p>

                    {/* Etymology / Roots */}
                    {word.etymology && (
                      <div className="mt-2.5 pt-2 border-t border-oros-850/80 flex items-start gap-1.5 text-[11px] text-oros-400">
                        <Compass className="w-3 h-3 text-oros-500 shrink-0 mt-0.5" />
                        <span className="font-mono text-oros-500 text-[10px] uppercase tracking-wider shrink-0">Root:</span>
                        <span className="italic text-oros-300">{word.etymology}</span>
                      </div>
                    )}

                    {/* Example Sentence */}
                    {word.examples && word.examples[0] && (
                      <div className="mt-2 p-2 rounded bg-oros-950/80 border border-oros-850 text-xs">
                        <p className="text-oros-300 italic">
                          "{word.examples[0].original}"
                        </p>
                        {word.examples[0].translation && (
                          <p className="text-[11px] text-oros-500 mt-1 font-sans">
                            → {word.examples[0].translation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Footer: Related Lore Entity Link */}
                  {relatedEntity && (
                    <div className="mt-3 pt-2 border-t border-oros-800/60 flex items-center justify-between text-xs">
                      <button
                        onClick={() => openTab({ title: relatedEntity.title, type: 'wiki', targetId: relatedEntity.id })}
                        className="flex items-center gap-1.5 text-oros-400 hover:text-accent transition-colors"
                      >
                        <Tag className="w-3 h-3 text-oros-500" />
                        <span className="truncate max-w-[200px]">{relatedEntity.title}</span>
                        <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* ADD / EDIT WORD MODAL */}
      {/* ======================================================== */}
      {showWordModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-800 rounded-[4px] w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-5 py-3.5 border-b border-oros-800 flex items-center justify-between bg-oros-900">
              <h3 className="font-serif text-sm font-bold text-oros-100 flex items-center gap-2">
                <BookA className="w-4 h-4 text-accent" />
                <span>{editingWord ? 'Edit Lexicon Term' : 'Add New Lexicon Term'}</span>
              </h3>
              <button
                onClick={() => setShowWordModal(false)}
                className="text-oros-400 hover:text-oros-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleWordSubmit} className="p-5 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Word Term */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Term / Word <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={wordTerm}
                    onChange={(e) => setWordTerm(e.target.value)}
                    placeholder="e.g. Skjaldmær, Khorash"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Phonetics */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Pronunciation / Phonetic
                  </label>
                  <input
                    type="text"
                    value={wordPhonetic}
                    onChange={(e) => setWordPhonetic(e.target.value)}
                    placeholder="e.g. [kho-RASH], /ˈskjɑld.mæːr/"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Part of Speech */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Part of Speech
                  </label>
                  <select
                    value={wordPos}
                    onChange={(e) => setWordPos(e.target.value as ConlangPartOfSpeech)}
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    {PARTS_OF_SPEECH.map(p => (
                      <option key={p.value} value={p.value}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Aliases / Inflections */}
                <div>
                  <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                    Plurals & Inflected Forms
                  </label>
                  <input
                    type="text"
                    value={wordAliases}
                    onChange={(e) => setWordAliases(e.target.value)}
                    placeholder="comma-separated, e.g. skjaldmeyjar"
                    className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Definition */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Definition & English Meaning <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={wordDefinition}
                  onChange={(e) => setWordDefinition(e.target.value)}
                  placeholder="Accurate in-world meaning and cultural context..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {/* Etymology / Roots */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Etymology & Root Origin
                </label>
                <input
                  type="text"
                  value={wordEtymology}
                  onChange={(e) => setWordEtymology(e.target.value)}
                  placeholder="e.g. Proto-Skaelish khor (iron) + ash (breath/vow)"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Example sentence */}
              <div className="space-y-2 pt-2 border-t border-oros-800">
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400">
                  Example Usage in Setting Prose
                </label>
                <input
                  type="text"
                  value={wordExampleOriginal}
                  onChange={(e) => setWordExampleOriginal(e.target.value)}
                  placeholder="Original phrase or dialogue..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent italic"
                />
                <input
                  type="text"
                  value={wordExampleTranslation}
                  onChange={(e) => setWordExampleTranslation(e.target.value)}
                  placeholder="Translation or interpretation..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              {/* Link to Lore Card */}
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Link Associated Lore Card
                </label>
                <select
                  value={wordRelatedEntityId}
                  onChange={(e) => setWordRelatedEntityId(e.target.value)}
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                >
                  <option value="">None (Standalone)</option>
                  {worldEntities.map(ent => (
                    <option key={ent.id} value={ent.id}>
                      {ent.title} ({ent.type})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-oros-800">
                <button
                  type="button"
                  onClick={() => setShowWordModal(false)}
                  className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[3px] text-xs font-semibold bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm"
                >
                  {editingWord ? 'Save Changes' : 'Add Term'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CONFIGURE / CREATE LANGUAGE MODAL */}
      {/* ======================================================== */}
      {showLangModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-oros-900 border border-oros-800 rounded-[4px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="px-5 py-3.5 border-b border-oros-800 flex items-center justify-between bg-oros-900">
              <h3 className="font-serif text-sm font-bold text-oros-100 flex items-center gap-2">
                <Languages className="w-4 h-4 text-accent" />
                <span>{editingLang ? 'Configure Language' : 'New Constructed Language'}</span>
              </h3>
              <button
                onClick={() => setShowLangModal(false)}
                className="text-oros-400 hover:text-oros-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLangSubmit} className="p-5 space-y-3.5">
              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Language Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={langName}
                  onChange={(e) => setLangName(e.target.value)}
                  placeholder="e.g. High Ostergardic, Ancient Runespeak"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Language Family / Dialect Group
                </label>
                <input
                  type="text"
                  value={langFamily}
                  onChange={(e) => setLangFamily(e.target.value)}
                  placeholder="e.g. Archaic Boreal Court Dialect"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Writing System / Script
                </label>
                <input
                  type="text"
                  value={langWritingSystem}
                  onChange={(e) => setLangWritingSystem(e.target.value)}
                  placeholder="e.g. Angular Runic, Cuneiform Carvings"
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={langDescription}
                  onChange={(e) => setLangDescription(e.target.value)}
                  placeholder="Where and by whom is this tongue spoken..."
                  className="w-full bg-oros-950 border border-oros-800 rounded-[3px] px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase font-semibold text-oros-400 mb-1">
                  Accent Color Pill
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={langColor}
                    onChange={(e) => setLangColor(e.target.value)}
                    className="w-8 h-8 rounded border border-oros-800 bg-transparent cursor-pointer"
                  />
                  <span className="font-mono text-xs text-oros-400">{langColor}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-oros-800">
                {editingLang && worldLanguages.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowLangModal(false)
                      handleDeleteLang(editingLang)
                    }}
                    className="px-2.5 py-1.5 rounded-[3px] text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowLangModal(false)}
                    className="px-3 py-1.5 rounded-[3px] text-xs text-oros-400 hover:text-oros-200 hover:bg-oros-850"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-[3px] text-xs font-semibold bg-accent text-accent-contrast hover:bg-accent-hover shadow-sm"
                  >
                    {editingLang ? 'Save Settings' : 'Create Language'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
