import React, { useState, useMemo, useEffect, useRef } from 'react'
import { useWorldStore } from '../../store/useWorldStore'
import { useToastStore } from '../../store/useToastStore'
import { 
  BookDown, Printer, FileText, Globe, Copy, Check, X,
  CheckSquare, Square, Layers, BookOpen, Sparkles
} from 'lucide-react'

export interface ManuscriptCompilerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type HeadingFormat = 'spelled' | 'numbered' | 'roman' | 'title-only';
type PreviewTab = 'print' | 'markdown' | 'reader';

const ROMAN_NUMERALS: [number, string][] = [
  [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
  [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
];

function toRoman(num: number): string {
  if (num <= 0) return num.toString();
  let result = '';
  let n = num;
  for (const [val, roman] of ROMAN_NUMERALS) {
    while (n >= val) {
      result += roman;
      n -= val;
    }
  }
  return result || num.toString();
}

const ONES = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function toSpelledWord(num: number): string {
  if (num <= 0) return num.toString();
  if (num < 20) return ONES[num];
  if (num < 100) {
    const tens = Math.floor(num / 10);
    const rest = num % 10;
    return rest > 0 ? `${TENS[tens]}-${ONES[rest]}` : TENS[tens];
  }
  return num.toString();
}

function cleanHtmlToMarkdown(html: string): string {
  if (!html) return '';
  return html
    .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n\n# $1\n\n')
    .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n\n## $1\n\n')
    .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n\n### $1\n\n')
    .replace(/<blockquote[^>]*>(.*?)<\/blockquote>/gi, '\n\n> $1\n\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>/gi, '\n\n')
    .replace(/<\/p>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
    .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
    .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
    .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
    .replace(/<span[^>]*class="[^"]*oros-mention[^"]*"[^>]*>(.*?)<\/span>/gi, '$1')
    .replace(/<span[^>]*class="[^"]*oros-spoiler[^"]*"[^>]*>(.*?)<\/span>/gi, '||$1||')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export const ManuscriptCompilerModal: React.FC<ManuscriptCompilerModalProps> = ({ isOpen, onClose }) => {
  const { manuscripts, activeWorldId, worlds } = useWorldStore();
  const { addToast } = useToastStore();

  const activeWorld = worlds.find(w => w.id === activeWorldId);
  const worldChapters = useMemo(() => {
    return activeWorldId ? [...(manuscripts[activeWorldId] || [])].sort((a, b) => a.order - b.order) : [];
  }, [activeWorldId, manuscripts]);

  // Form State
  const [bookTitle, setBookTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [authorName, setAuthorName] = useState(() => {
    try {
      return localStorage.getItem('oros_compiler_author') || 'Anonymous Chronicler';
    } catch {
      return 'Anonymous Chronicler';
    }
  });
  const [draftStatus, setDraftStatus] = useState<string>('Standard Manuscript');
  const [headingFormat, setHeadingFormat] = useState<HeadingFormat>('spelled');
  const [includeToc, setIncludeToc] = useState<boolean>(true);
  const [sceneBreak, setSceneBreak] = useState<string>('* * *');
  const [selectedChapterIds, setSelectedChapterIds] = useState<Set<string>>(new Set());
  const [previewTab, setPreviewTab] = useState<PreviewTab>('print');
  const [copied, setCopied] = useState(false);

  // Initialize values when opening
  useEffect(() => {
    if (isOpen) {
      if (activeWorld) {
        setBookTitle(activeWorld.name);
        setSubtitle(activeWorld.tagline || '');
      }
      setSelectedChapterIds(new Set(worldChapters.map(c => c.id)));
    }
  }, [isOpen, activeWorld, worldChapters]);

  const handleSelectAll = () => {
    setSelectedChapterIds(new Set(worldChapters.map(c => c.id)));
  };

  const handleDeselectAll = () => {
    setSelectedChapterIds(new Set());
  };

  const toggleChapter = (id: string) => {
    setSelectedChapterIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const selectedChapters = useMemo(() => {
    return worldChapters.filter(c => selectedChapterIds.has(c.id));
  }, [worldChapters, selectedChapterIds]);

  const selectedWordCount = useMemo(() => {
    return selectedChapters.reduce((acc, c) => acc + (c.wordCount || 0), 0);
  }, [selectedChapters]);

  const estimatedReadingTime = useMemo(() => {
    return Math.max(1, Math.round(selectedWordCount / 225));
  }, [selectedWordCount]);

  const getFormattedHeading = (index: number, title: string) => {
    switch (headingFormat) {
      case 'spelled':
        return `Chapter ${toSpelledWord(index + 1)}: ${title}`;
      case 'numbered':
        return `Chapter ${index + 1}: ${title}`;
      case 'roman':
        return `Chapter ${toRoman(index + 1)}: ${title}`;
      case 'title-only':
        return title;
    }
  };

  // Compile Markdown Document
  const compiledMarkdown = useMemo(() => {
    const lines: string[] = [];
    lines.push(`# ${bookTitle || 'Untitled Book'}`);
    if (subtitle) lines.push(`*${subtitle}*\n`);
    lines.push(`**By ${authorName || 'Author'}**\n`);
    lines.push(`Edition: ${draftStatus}`);
    lines.push(`Date: ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}`);
    lines.push(`Length: ${selectedChapters.length} Chapters · ${selectedWordCount.toLocaleString()} Words\n`);
    lines.push(`---\n`);

    if (includeToc && selectedChapters.length > 0) {
      lines.push(`## Table of Contents\n`);
      selectedChapters.forEach((ch, idx) => {
        const heading = getFormattedHeading(idx, ch.title);
        lines.push(`${idx + 1}. [${heading}](#chapter-${idx + 1})`);
      });
      lines.push(`\n---\n`);
    }

    selectedChapters.forEach((ch, idx) => {
      const heading = getFormattedHeading(idx, ch.title);
      lines.push(`## <a name="chapter-${idx + 1}"></a>${heading}\n`);
      const prose = cleanHtmlToMarkdown(ch.content);
      lines.push(prose || '*(No prose recorded in this chapter)*');
      if (idx < selectedChapters.length - 1 && sceneBreak) {
        lines.push(`\n\n${sceneBreak}\n\n`);
      }
    });

    return lines.join('\n');
  }, [bookTitle, subtitle, authorName, draftStatus, selectedChapters, selectedWordCount, includeToc, headingFormat, sceneBreak]);

  // Generate Print / PDF Layout HTML
  const generatePrintHtml = () => {
    const tocItems = selectedChapters.map((ch, idx) => {
      return `<div style="display:flex; justify-content:space-between; margin-bottom:8px; border-bottom:1px dotted #ccc; padding-bottom:2px;">
        <span>${getFormattedHeading(idx, ch.title)}</span>
        <span>${ch.wordCount || 0}w</span>
      </div>`;
    }).join('\n');

    const chapterSections = selectedChapters.map((ch, idx) => {
      return `
        <article class="chapter" style="page-break-before: always; break-before: page; margin-top: 4rem;">
          <header class="chapter-header" style="text-align: center; margin-bottom: 2.5rem;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.85rem; letter-spacing: 0.15em; text-transform: uppercase; color: #555; margin-bottom: 0.5rem;">
              ${headingFormat === 'title-only' ? '' : `Chapter ${idx + 1}`}
            </div>
            <h1 style="font-family: 'Cormorant Garamond', Georgia, serif; font-size: 2.2rem; font-weight: 700; color: #111; margin: 0; line-height: 1.2;">
              ${ch.title}
            </h1>
          </header>
          <div class="chapter-body" style="font-family: 'Literata', Georgia, serif; font-size: 11pt; line-height: 1.8; color: #222; text-align: justify;">
            ${ch.content || '<p><em>(Empty Chapter)</em></p>'}
          </div>
          ${idx < selectedChapters.length - 1 && sceneBreak ? `<div style="text-align: center; margin: 3rem 0; font-family: serif; font-size: 1.2rem; letter-spacing: 0.3em; color: #666;">${sceneBreak}</div>` : ''}
        </article>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${bookTitle || 'Manuscript'} - ${authorName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">
  <style>
    @page {
      size: letter;
      margin: 1in;
      @bottom-right {
        content: counter(page);
        font-family: 'IBM Plex Mono', monospace;
        font-size: 9pt;
      }
      @top-left {
        content: "${authorName} / ${bookTitle}";
        font-family: 'Literata', Georgia, serif;
        font-style: italic;
        font-size: 8.5pt;
        color: #777;
      }
    }
    body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #111111;
      font-family: 'Literata', Georgia, serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .title-page {
      min-height: 85vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      page-break-after: always;
      break-after: page;
      padding: 4rem 1rem;
    }
    .title-page h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 3.5rem;
      font-weight: 700;
      margin: 0 0 1rem 0;
      line-height: 1.1;
      letter-spacing: -0.01em;
    }
    .title-page .subtitle {
      font-size: 1.25rem;
      font-style: italic;
      color: #555;
      margin-bottom: 3rem;
      max-width: 600px;
    }
    .title-page .author {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 4rem;
      color: #222;
    }
    .title-page .meta {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.85rem;
      color: #666;
      line-height: 1.6;
    }
    .toc-page {
      page-break-before: always;
      break-before: page;
      page-break-after: always;
      break-after: page;
      padding: 3rem 0;
      max-width: 650px;
      margin: 0 auto;
    }
    .toc-page h2 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 2rem;
      text-align: center;
      margin-bottom: 2rem;
    }
    .chapter-body p {
      margin-top: 0;
      margin-bottom: 0.85rem;
      text-indent: 1.5em;
    }
    .chapter-body p:first-of-type {
      text-indent: 0;
    }
    .chapter-body blockquote {
      border-left: 2px solid #333;
      margin: 1.5rem 0 1.5rem 2rem;
      padding-left: 1rem;
      font-style: italic;
    }
    .oros-mention {
      font-weight: 600;
      color: #111;
    }
    .oros-spoiler {
      background: #eee;
      padding: 2px 4px;
    }
    @media screen {
      body {
        max-width: 750px;
        margin: 2rem auto;
        padding: 3rem;
        background: #ffffff;
        box-shadow: 0 4px 20px rgba(0,0,0,0.25);
        border-radius: 4px;
      }
    }
  </style>
</head>
<body>
  <div class="title-page">
    <h1>${bookTitle || 'Untitled Book'}</h1>
    ${subtitle ? `<div class="subtitle">${subtitle}</div>` : ''}
    <div class="author">By ${authorName || 'Anonymous'}</div>
    <div class="meta">
      <div>${draftStatus}</div>
      <div>${selectedChapters.length} Chapters · ${selectedWordCount.toLocaleString()} Words</div>
      <div>Project OROS Worldbuilding Suite</div>
    </div>
  </div>

  ${includeToc ? `
    <div class="toc-page">
      <h2>Table of Contents</h2>
      ${tocItems}
    </div>
  ` : ''}

  ${chapterSections}
</body>
</html>`;
  };

  // Generate E-Reader Offline Single-File HTML
  const generateReaderHtml = () => {
    const chapterButtons = selectedChapters.map((ch, idx) => {
      return `<a href="#ch-${idx}" class="toc-link">${getFormattedHeading(idx, ch.title)}</a>`;
    }).join('\n');

    const chapterArticles = selectedChapters.map((ch, idx) => {
      return `
        <article id="ch-${idx}" class="reader-chapter">
          <header>
            <span class="chap-badge">${headingFormat === 'title-only' ? '' : `Chapter ${idx + 1}`}</span>
            <h2>${ch.title}</h2>
          </header>
          <div class="reader-prose">
            ${ch.content || '<p><em>(Empty Chapter)</em></p>'}
          </div>
          ${idx < selectedChapters.length - 1 && sceneBreak ? `<div class="divider">${sceneBreak}</div>` : ''}
        </article>
      `;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${bookTitle || 'Manuscript'} - ${authorName}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&family=Literata:ital,opsz,wght@0,7..72,400;0,7..72,600;1,7..72,400&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg-primary: #121316;
      --bg-secondary: #1a1c23;
      --text-primary: #e2e8f0;
      --text-secondary: #94a3b8;
      --accent: #f5c542;
      --border: #2e3440;
    }
    [data-theme="light"] {
      --bg-primary: #f8fafc;
      --bg-secondary: #ffffff;
      --text-primary: #0f172a;
      --text-secondary: #475569;
      --accent: #d97706;
      --border: #e2e8f0;
    }
    [data-theme="sepia"] {
      --bg-primary: #fbf0d9;
      --bg-secondary: #f4e4c1;
      --text-primary: #5f4b32;
      --text-secondary: #7d6b53;
      --accent: #b45309;
      --border: #e2d2ae;
    }
    body {
      margin: 0;
      padding: 0;
      background: var(--bg-primary);
      color: var(--text-primary);
      font-family: 'Literata', Georgia, serif;
      line-height: 1.8;
      transition: background 0.2s, color 0.2s;
    }
    header.site-header {
      position: sticky;
      top: 0;
      background: var(--bg-secondary);
      border-bottom: 1px solid var(--border);
      padding: 0.75rem 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 50;
    }
    .header-title {
      font-family: 'Cormorant Garamond', serif;
      font-weight: 700;
      font-size: 1.25rem;
    }
    .theme-controls button {
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text-primary);
      padding: 4px 10px;
      border-radius: 4px;
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.75rem;
      cursor: pointer;
      margin-left: 4px;
    }
    .reader-container {
      max-width: 720px;
      margin: 3rem auto;
      padding: 0 1.5rem 6rem;
    }
    .reader-book-meta {
      text-align: center;
      margin-bottom: 4rem;
      padding-bottom: 3rem;
      border-bottom: 1px solid var(--border);
    }
    .reader-book-meta h1 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 3rem;
      margin: 0 0 0.5rem;
      line-height: 1.1;
    }
    .reader-book-meta .author {
      font-size: 1.25rem;
      color: var(--text-secondary);
      font-style: italic;
    }
    .reader-chapter {
      margin-bottom: 4rem;
      scroll-margin-top: 5rem;
    }
    .reader-chapter header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .chap-badge {
      font-family: 'IBM Plex Mono', monospace;
      font-size: 0.8rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
    }
    .reader-chapter h2 {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 2.2rem;
      margin: 0.25rem 0 0;
    }
    .reader-prose p {
      margin-bottom: 1.25rem;
      text-align: justify;
    }
    .divider {
      text-align: center;
      letter-spacing: 0.4em;
      color: var(--text-secondary);
      margin: 3rem 0;
    }
    .oros-mention {
      color: var(--accent);
      font-weight: 600;
    }
    .oros-spoiler {
      background: var(--border);
      padding: 2px 4px;
      border-radius: 2px;
      cursor: pointer;
    }
    .toc-drawer {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 1.25rem;
      margin-bottom: 3.5rem;
    }
    .toc-drawer h3 {
      margin: 0 0 1rem;
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
    }
    .toc-link {
      display: block;
      color: var(--text-secondary);
      text-decoration: none;
      padding: 4px 0;
      border-bottom: 1px dashed var(--border);
      font-size: 0.95rem;
    }
    .toc-link:hover {
      color: var(--accent);
    }
  </style>
</head>
<body>
  <header class="site-header">
    <div class="header-title">${bookTitle || 'Manuscript'}</div>
    <div class="theme-controls">
      <button onclick="document.documentElement.setAttribute('data-theme', 'dark')">Dark</button>
      <button onclick="document.documentElement.setAttribute('data-theme', 'sepia')">Sepia</button>
      <button onclick="document.documentElement.setAttribute('data-theme', 'light')">Light</button>
    </div>
  </header>

  <main class="reader-container">
    <div class="reader-book-meta">
      <h1>${bookTitle || 'Untitled Book'}</h1>
      ${subtitle ? `<p style="font-style: italic; color: var(--text-secondary);">${subtitle}</p>` : ''}
      <div class="author">By ${authorName || 'Author'}</div>
      <div style="font-family: 'IBM Plex Mono', monospace; font-size: 0.8rem; margin-top: 1rem; color: var(--text-secondary);">
        ${draftStatus} · ${selectedChapters.length} Chapters · ${selectedWordCount.toLocaleString()} Words (~${estimatedReadingTime} min read)
      </div>
    </div>

    ${includeToc ? `
      <div class="toc-drawer">
        <h3>Contents</h3>
        ${chapterButtons}
      </div>
    ` : ''}

    ${chapterArticles}
  </main>
</body>
</html>`;
  };

  // Printable Frame Ref for Native Chromium/Electron Print Dialog
  const handlePrint = () => {
    if (selectedChapters.length === 0) {
      addToast('No chapters selected for print', 'warning');
      return;
    }

    try {
      const printableHtml = generatePrintHtml();
      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow?.document;
      if (frameDoc) {
        frameDoc.open();
        frameDoc.write(printableHtml);
        frameDoc.close();
        
        setTimeout(() => {
          printFrame.contentWindow?.focus();
          printFrame.contentWindow?.print();
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 1500);
        }, 400);

        addToast('Opening print dialog. Select "Save as PDF" to export PDF', 'info');
      }
    } catch (err) {
      console.error('Print failure:', err);
      addToast('Failed to trigger print dialog', 'error');
    }
  };

  // Export Markdown File
  const handleExportMarkdown = async () => {
    if (selectedChapters.length === 0) {
      addToast('No chapters selected to export', 'warning');
      return;
    }

    const safeTitle = `${(bookTitle || 'Manuscript').replace(/[^a-z0-9_-]/gi, '_')}_Compiled`;
    try {
      if (typeof window !== 'undefined' && window.oros) {
        const success = await window.oros.exportFile(safeTitle, compiledMarkdown, 'md', 'Markdown Document');
        if (success) {
          addToast(`Manuscript saved as ${safeTitle}.md`, 'success');
        }
      } else {
        const blob = new Blob([compiledMarkdown], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.md`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`Manuscript downloaded as ${safeTitle}.md`, 'success');
      }
    } catch {
      addToast('Error saving markdown file', 'error');
    }
  };

  // Export Standalone HTML E-Reader
  const handleExportHtml = async () => {
    if (selectedChapters.length === 0) {
      addToast('No chapters selected to export', 'warning');
      return;
    }

    const safeTitle = `${(bookTitle || 'Book').replace(/[^a-z0-9_-]/gi, '_')}_Reader`;
    const readerHtml = generateReaderHtml();
    try {
      if (typeof window !== 'undefined' && window.oros) {
        const success = await window.oros.exportFile(safeTitle, readerHtml, 'html', 'HTML Document');
        if (success) {
          addToast(`E-Reader exported as ${safeTitle}.html`, 'success');
        }
      } else {
        const blob = new Blob([readerHtml], { type: 'text/html;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${safeTitle}.html`;
        a.click();
        URL.revokeObjectURL(url);
        addToast(`E-Reader downloaded as ${safeTitle}.html`, 'success');
      }
    } catch {
      addToast('Error saving HTML reader file', 'error');
    }
  };

  // Copy Markdown to Clipboard
  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(compiledMarkdown);
      setCopied(true);
      addToast('Compiled manuscript copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Failed to copy to clipboard', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-oros-950 border border-oros-800 rounded-lg shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden text-oros-100"
        role="dialog"
        aria-modal="true"
        aria-labelledby="compiler-modal-title"
      >
        {/* Header */}
        <header className="p-4 border-b border-oros-800 flex items-center justify-between bg-oros-925/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-accent-muted border border-accent/30 text-accent">
              <BookDown className="w-5 h-5" />
            </div>
            <div>
              <h2 id="compiler-modal-title" className="font-serif text-lg font-bold text-oros-100 leading-tight">
                Manuscript Book Compiler
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded text-oros-400 hover:text-oros-200 hover:bg-oros-900 transition-colors"
              title="Close compiler"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Split: Left Controls, Right Live Preview */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Configuration Controls */}
          <aside className="w-84 lg:w-96 border-r border-oros-800 bg-oros-950 flex flex-col shrink-0 overflow-y-auto p-4 space-y-5">
            {/* Frontmatter Group */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-oros-400 font-mono flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-accent" />
                <span>Frontmatter & Metadata</span>
              </div>

              <div>
                <label className="text-[11px] text-oros-300 font-medium block mb-1">Book Title</label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter manuscript title..."
                  className="w-full bg-oros-900 border border-oros-750 rounded px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div>
                <label className="text-[11px] text-oros-300 font-medium block mb-1">Subtitle / Tagline</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Optional book subtitle..."
                  className="w-full bg-oros-900 border border-oros-750 rounded px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-oros-300 font-medium block mb-1">Author Name</label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={(e) => {
                      setAuthorName(e.target.value);
                      try {
                        localStorage.setItem('oros_compiler_author', e.target.value);
                      } catch {}
                    }}
                    placeholder="Author name..."
                    className="w-full bg-oros-900 border border-oros-750 rounded px-2.5 py-1.5 text-xs text-oros-100 placeholder-oros-500 focus:outline-none focus:border-accent"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-oros-300 font-medium block mb-1">Edition / Status</label>
                  <select
                    value={draftStatus}
                    onChange={(e) => setDraftStatus(e.target.value)}
                    className="w-full bg-oros-900 border border-oros-750 rounded px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    <option value="First Draft">First Draft</option>
                    <option value="Revision Draft">Revision Draft</option>
                    <option value="Beta Reader Copy">Beta Copy</option>
                    <option value="Standard Manuscript">Standard Manuscript</option>
                    <option value="Submission Copy">Submission Copy</option>
                    <option value="Final Edition">Final Edition</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Layout & Numeral Styling */}
            <div className="space-y-3 pt-3 border-t border-oros-800">
              <div className="text-xs font-semibold uppercase tracking-wider text-oros-400 font-mono flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-accent" />
                <span>Chapter & Layout Styling</span>
              </div>

              <div>
                <label className="text-[11px] text-oros-300 font-medium block mb-1">Heading Numbering Style</label>
                <select
                  value={headingFormat}
                  onChange={(e) => setHeadingFormat(e.target.value as HeadingFormat)}
                  className="w-full bg-oros-900 border border-oros-750 rounded px-2.5 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                >
                  <option value="spelled">Spelled Words ("Chapter One: The Awakening")</option>
                  <option value="numbered">Arabic Numerals ("Chapter 1: The Awakening")</option>
                  <option value="roman">Roman Numerals ("Chapter I: The Awakening")</option>
                  <option value="title-only">Title Only ("The Awakening")</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-oros-300 font-medium block mb-1">Scene Break Symbol</label>
                  <select
                    value={sceneBreak}
                    onChange={(e) => setSceneBreak(e.target.value)}
                    className="w-full bg-oros-900 border border-oros-750 rounded px-2 py-1.5 text-xs text-oros-100 focus:outline-none focus:border-accent"
                  >
                    <option value="* * *">* * * (Traditional)</option>
                    <option value="***">*** (Compact)</option>
                    <option value="✦ ✦ ✦">✦ ✦ ✦ (Floral Asterism)</option>
                    <option value="~ ~ ~">~ ~ ~ (Soft Wave)</option>
                    <option value="">None (Page Break Only)</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer pb-2">
                    <input
                      type="checkbox"
                      checked={includeToc}
                      onChange={(e) => setIncludeToc(e.target.checked)}
                      className="rounded border-oros-700 bg-oros-900 text-accent focus:ring-accent"
                    />
                    <span className="text-xs text-oros-200">Include Contents</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Chapter Selection Checklist */}
            <div className="space-y-2 pt-3 border-t border-oros-800 flex-1 flex flex-col">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-oros-400 font-mono">
                  Chapters ({selectedChapters.length}/{worldChapters.length})
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <button
                    onClick={handleSelectAll}
                    className="text-accent hover:underline font-medium"
                  >
                    Select All
                  </button>
                  <span className="text-oros-600">·</span>
                  <button
                    onClick={handleDeselectAll}
                    className="text-oros-400 hover:text-oros-200"
                  >
                    Clear
                  </button>
                </div>
              </div>

              <div className="space-y-1 overflow-y-auto max-h-48 border border-oros-800/80 rounded bg-oros-900/40 p-1.5">
                {worldChapters.length === 0 ? (
                  <div className="p-3 text-center text-xs text-oros-500">
                    No chapters exist in this world.
                  </div>
                ) : (
                  worldChapters.map((ch, idx) => {
                    const isChecked = selectedChapterIds.has(ch.id);
                    return (
                      <div
                        key={ch.id}
                        onClick={() => toggleChapter(ch.id)}
                        className={`flex items-center justify-between p-2 rounded text-xs cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-oros-850 text-oros-100 font-medium' 
                            : 'hover:bg-oros-900 text-oros-400'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate pr-2">
                          {isChecked ? (
                            <CheckSquare className="w-3.5 h-3.5 text-accent shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-oros-600 shrink-0" />
                          )}
                          <span className="truncate">
                            <span className="font-mono text-oros-500 mr-1.5">{idx + 1}.</span>
                            {ch.title}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-oros-400 shrink-0">
                          {ch.wordCount || 0}w
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Running Word Count Footer */}
              <div className="p-2.5 rounded bg-oros-900 border border-oros-800 text-xs font-mono text-oros-300 flex items-center justify-between">
                <span>Total Output:</span>
                <span className="text-accent font-semibold">
                  {selectedWordCount.toLocaleString()} words (~{estimatedReadingTime} min)
                </span>
              </div>
            </div>
          </aside>

          {/* Right Column: Live Interactive Preview & Action Dock */}
          <main className="flex-1 flex flex-col overflow-hidden bg-oros-925/60">
            {/* Action Bar & Tabs */}
            <div className="p-3 border-b border-oros-800 flex flex-wrap items-center justify-between gap-3 bg-oros-950/80 shrink-0">
              {/* Preview Modes */}
              <div className="flex items-center gap-1 bg-oros-900 p-0.5 rounded border border-oros-800">
                <button
                  onClick={() => setPreviewTab('print')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewTab === 'print' 
                      ? 'btn-accent shadow-sm' 
                      : 'text-oros-400 hover:text-oros-200'
                  }`}
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Printable Manuscript</span>
                </button>

                <button
                  onClick={() => setPreviewTab('markdown')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewTab === 'markdown' 
                      ? 'btn-accent shadow-sm' 
                      : 'text-oros-400 hover:text-oros-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Markdown (.md)</span>
                </button>

                <button
                  onClick={() => setPreviewTab('reader')}
                  className={`px-3 py-1 rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    previewTab === 'reader' 
                      ? 'btn-accent shadow-sm' 
                      : 'text-oros-400 hover:text-oros-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Web E-Reader</span>
                </button>
              </div>

              {/* Primary Output Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="px-2.5 py-1.5 rounded bg-oros-900 border border-oros-750 text-oros-300 hover:text-oros-100 hover:bg-oros-850 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Copy formatted markdown to clipboard"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>

                <button
                  onClick={handleExportMarkdown}
                  className="px-3 py-1.5 rounded bg-oros-900 border border-oros-750 text-oros-200 hover:text-oros-100 hover:bg-oros-850 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Save complete manuscript as .md file"
                >
                  <FileText className="w-3.5 h-3.5 text-accent" />
                  <span>Export .md</span>
                </button>

                <button
                  onClick={handleExportHtml}
                  className="px-3 py-1.5 rounded bg-oros-900 border border-oros-750 text-oros-200 hover:text-oros-100 hover:bg-oros-850 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Export offline interactive HTML e-reader"
                >
                  <Globe className="w-3.5 h-3.5 text-accent" />
                  <span>Export HTML</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-4 py-1.5 rounded btn-accent text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                  title="Open Print Dialog to print or Save as PDF"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print to PDF</span>
                </button>
              </div>
            </div>

            {/* Main Preview Screen */}
            <div className="flex-1 overflow-y-auto p-6 flex justify-center">
              {/* Tab 1: Printable Manuscript Sheet Preview */}
              {previewTab === 'print' && (
                <div className="w-full max-w-2xl bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-300 select-text font-serif min-h-[700px]">
                  {/* Top Running Head Mock */}
                  <div className="border-b border-slate-200 pb-2 mb-8 flex justify-between text-[11px] font-sans text-slate-400 uppercase tracking-widest">
                    <span>{authorName} / {bookTitle || 'Untitled Book'}</span>
                    <span>Manuscript Proof</span>
                  </div>

                  {/* Title Page Mock */}
                  <div className="text-center py-8 border-b border-slate-200 mb-10">
                    <h1 className="text-3xl sm:text-4xl font-bold font-serif mb-2 text-slate-900 leading-tight">
                      {bookTitle || 'Untitled Book'}
                    </h1>
                    {subtitle && <p className="text-sm italic text-slate-600 mb-4">{subtitle}</p>}
                    <p className="text-base font-semibold text-slate-800 mb-6">By {authorName}</p>
                    <div className="font-mono text-xs text-slate-500 space-y-1">
                      <div>{draftStatus}</div>
                      <div>{selectedChapters.length} Chapters · {selectedWordCount.toLocaleString()} Words</div>
                    </div>
                  </div>

                  {/* Table of Contents Mock */}
                  {includeToc && selectedChapters.length > 0 && (
                    <div className="mb-10 pb-8 border-b border-slate-200">
                      <h2 className="text-xl font-bold text-center mb-4 text-slate-900 font-serif">Table of Contents</h2>
                      <div className="space-y-1.5 text-xs text-slate-700 max-w-md mx-auto">
                        {selectedChapters.map((ch, idx) => (
                          <div key={ch.id} className="flex justify-between border-b border-dotted border-slate-300 pb-0.5">
                            <span>{getFormattedHeading(idx, ch.title)}</span>
                            <span className="font-mono text-slate-400">{ch.wordCount || 0}w</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Chapters Body */}
                  <div className="space-y-12">
                    {selectedChapters.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 text-sm italic">
                        No chapters selected. Check one or more chapters on the left to include in the compilation.
                      </div>
                    ) : (
                      selectedChapters.map((ch, idx) => (
                        <div key={ch.id} className="space-y-4">
                          <div className="text-center pt-4">
                            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-500 mb-1">
                              {headingFormat === 'title-only' ? '' : `Chapter ${idx + 1}`}
                            </div>
                            <h2 className="text-2xl font-bold text-slate-900 font-serif">
                              {ch.title}
                            </h2>
                          </div>

                          <div 
                            className="text-[13px] leading-relaxed text-slate-800 text-justify space-y-3"
                            dangerouslySetInnerHTML={{ __html: ch.content || '<p><em>(Empty Chapter)</em></p>' }}
                          />

                          {idx < selectedChapters.length - 1 && sceneBreak && (
                            <div className="text-center py-6 text-slate-400 font-serif text-sm tracking-widest">
                              {sceneBreak}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Tab 2: Raw Markdown Output View */}
              {previewTab === 'markdown' && (
                <div className="w-full max-w-4xl bg-oros-950 border border-oros-800 rounded p-4 font-mono text-xs text-oros-300 overflow-x-auto whitespace-pre-wrap select-text">
                  {compiledMarkdown}
                </div>
              )}

              {/* Tab 3: Web E-Reader Sandbox Mock */}
              {previewTab === 'reader' && (
                <div className="w-full max-w-2xl bg-oros-900 border border-oros-800 rounded-lg p-6 sm:p-10 shadow-xl select-text">
                  <div className="text-center pb-6 border-b border-oros-800 mb-8">
                    <span className="font-mono text-[10px] text-accent uppercase tracking-widest">
                      Digital E-Reader Edition
                    </span>
                    <h1 className="text-3xl font-serif font-bold text-oros-100 mt-2 mb-1">
                      {bookTitle || 'Untitled Book'}
                    </h1>
                    {subtitle && <p className="text-xs text-oros-400 italic mb-2">{subtitle}</p>}
                    <p className="text-sm text-oros-300">By {authorName}</p>
                  </div>

                  <div className="space-y-10">
                    {selectedChapters.map((ch, idx) => (
                      <div key={ch.id} className="space-y-4">
                        <div className="text-center">
                          <span className="font-mono text-[10px] text-accent uppercase tracking-wider">
                            {headingFormat === 'title-only' ? '' : `Chapter ${idx + 1}`}
                          </span>
                          <h2 className="text-xl font-serif font-bold text-oros-100 mt-1">
                            {ch.title}
                          </h2>
                        </div>
                        <div 
                          className="oros-wiki-prose text-sm text-oros-200 leading-relaxed text-justify"
                          dangerouslySetInnerHTML={{ __html: ch.content || '<p><em>(Empty Chapter)</em></p>' }}
                        />
                        {idx < selectedChapters.length - 1 && sceneBreak && (
                          <div className="text-center py-4 text-oros-500 font-serif tracking-widest text-xs">
                            {sceneBreak}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};
