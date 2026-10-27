import { World, ThemeConfig, CssSnippet, ThemeTokens, ThemePresetId } from '@shared/types'

interface RgbColor {
  r: number
  g: number
  b: number
}

export type { ThemeTokens }

export interface ThemePresetOption {
  id: ThemePresetId
  name: string
  hex: string
  author?: string
  desc?: string
}

export const THEME_PRESETS: ThemePresetOption[] = [
  { id: 'amethyst', name: 'Arcane Amethyst', hex: '#c084fc', author: 'Oros Team', desc: 'Deep mystic velvet purple background with luminous violet' },
  { id: 'sovereign', name: 'Platinum Sovereign', hex: '#ffffff', author: 'Oros Team', desc: 'Precision silver and lunar platinum' },
  { id: 'obsidian', name: 'Obsidian Midnight', hex: '#94a3b8', author: 'Oros Team', desc: 'Tactile charcoal slate and physical hairlines' },
  { id: 'mythic', name: 'Mythic Amber', hex: '#f5c542', author: 'Oros Team', desc: 'Illuminated gold and warm archival parchment' },
  { id: 'cyber', name: 'Cyber Cyan', hex: '#00f0ff', author: 'Oros Team', desc: 'Electric cyan against deep void slates' },
  { id: 'crimson', name: 'Crimson Ember', hex: '#f43f5e', author: 'Oros Team', desc: 'Rich nocturne rose and rubies' },
  { id: 'hazard', name: 'Hazard Ochre', hex: '#f97316', author: 'Oros Team', desc: 'Industrial amber-orange with mechanical precision' },
  { id: 'emerald', name: 'Emerald Verdant', hex: '#10b981', author: 'Oros Team', desc: 'Deep botanical emerald and jade' },
  { id: 'nord', name: 'Nordic Frost', hex: '#88c0d0', author: 'Arctic', desc: 'Cool arctic cyan and winter twilight tones' },
  { id: 'parchment', name: 'Solarized Parchment', hex: '#e5c07b', author: 'Ethan S.', desc: 'Warm manuscript ochre and antique vellum' }
]

export const PRESET_THEMES: Record<string, ThemeTokens> = {
  amethyst: {
    accent: '#c084fc',
    muted: 'rgba(192, 132, 252, 0.16)',
    subtle: 'rgba(192, 132, 252, 0.06)',
    border: 'rgba(192, 132, 252, 0.38)',
    hover: '#d8b4fe',
    ring: 'rgba(192, 132, 252, 0.30)',
    glow: 'rgba(192, 132, 252, 0.28)',
    contrast: '#130f1c',
    dots: 'rgba(192, 132, 252, 0.35)',
  },
  sovereign: {
    accent: '#ffffff',
    muted: 'rgba(255, 255, 255, 0.12)',
    subtle: 'rgba(255, 255, 255, 0.05)',
    border: 'rgba(255, 255, 255, 0.30)',
    hover: '#ffffff',
    ring: 'rgba(255, 255, 255, 0.25)',
    glow: 'rgba(255, 255, 255, 0.20)',
    contrast: '#090a0d',
    dots: 'rgba(255, 255, 255, 0.28)',
  },
  obsidian: {
    accent: '#94a3b8',
    muted: 'rgba(148, 163, 184, 0.14)',
    subtle: 'rgba(148, 163, 184, 0.05)',
    border: 'rgba(148, 163, 184, 0.35)',
    hover: '#cbd5e1',
    ring: 'rgba(148, 163, 184, 0.30)',
    glow: 'rgba(148, 163, 184, 0.20)',
    contrast: '#090a0d',
    dots: 'rgba(148, 163, 184, 0.35)',
  },
  mythic: {
    accent: '#f5c542',
    muted: 'rgba(245, 197, 66, 0.14)',
    subtle: 'rgba(245, 197, 66, 0.05)',
    border: 'rgba(245, 197, 66, 0.35)',
    hover: '#fde047',
    ring: 'rgba(245, 197, 66, 0.30)',
    glow: 'rgba(245, 197, 66, 0.25)',
    contrast: '#090a0d',
    dots: 'rgba(245, 197, 66, 0.38)',
  },
  cyber: {
    accent: '#00f0ff',
    muted: 'rgba(0, 240, 255, 0.15)',
    subtle: 'rgba(0, 240, 255, 0.06)',
    border: 'rgba(0, 240, 255, 0.38)',
    hover: '#38bdf8',
    ring: 'rgba(0, 240, 255, 0.30)',
    glow: 'rgba(0, 240, 255, 0.28)',
    contrast: '#060b12',
    dots: 'rgba(0, 240, 255, 0.38)',
  },
  crimson: {
    accent: '#f43f5e',
    muted: 'rgba(244, 63, 94, 0.14)',
    subtle: 'rgba(244, 63, 94, 0.05)',
    border: 'rgba(244, 63, 94, 0.35)',
    hover: '#fb7185',
    ring: 'rgba(244, 63, 94, 0.30)',
    glow: 'rgba(244, 63, 94, 0.25)',
    contrast: '#ffffff',
    dots: 'rgba(244, 63, 94, 0.38)',
  },
  hazard: {
    accent: '#f97316',
    muted: 'rgba(249, 115, 22, 0.14)',
    subtle: 'rgba(249, 115, 22, 0.05)',
    border: 'rgba(249, 115, 22, 0.35)',
    hover: '#fb923c',
    ring: 'rgba(249, 115, 22, 0.30)',
    glow: 'rgba(249, 115, 22, 0.25)',
    contrast: '#090a0d',
    dots: 'rgba(249, 115, 22, 0.38)',
  },
  emerald: {
    accent: '#10b981',
    muted: 'rgba(16, 185, 129, 0.14)',
    subtle: 'rgba(16, 185, 129, 0.05)',
    border: 'rgba(16, 185, 129, 0.35)',
    hover: '#34d399',
    ring: 'rgba(16, 185, 129, 0.30)',
    glow: 'rgba(16, 185, 129, 0.25)',
    contrast: '#090a0d',
    dots: 'rgba(16, 185, 129, 0.38)',
  },
  nord: {
    accent: '#88c0d0',
    muted: 'rgba(136, 192, 208, 0.14)',
    subtle: 'rgba(136, 192, 208, 0.05)',
    border: 'rgba(136, 192, 208, 0.35)',
    hover: '#81a1c1',
    ring: 'rgba(136, 192, 208, 0.30)',
    glow: 'rgba(136, 192, 208, 0.25)',
    contrast: '#242933',
    dots: 'rgba(136, 192, 208, 0.38)',
  },
  parchment: {
    accent: '#e5c07b',
    muted: 'rgba(229, 192, 123, 0.14)',
    subtle: 'rgba(229, 192, 123, 0.05)',
    border: 'rgba(229, 192, 123, 0.35)',
    hover: '#f3d699',
    ring: 'rgba(229, 192, 123, 0.30)',
    glow: 'rgba(229, 192, 123, 0.25)',
    contrast: '#171412',
    dots: 'rgba(229, 192, 123, 0.38)',
  }
}

export const PRESET_THEMES_LIGHT: Record<string, ThemeTokens> = {
  amethyst: {
    accent: '#9333ea',
    muted: 'rgba(147, 51, 234, 0.12)',
    subtle: 'rgba(147, 51, 234, 0.04)',
    border: 'rgba(147, 51, 234, 0.32)',
    hover: '#7e22ce',
    ring: 'rgba(147, 51, 234, 0.25)',
    glow: 'rgba(147, 51, 234, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(147, 51, 234, 0.35)',
  },
  sovereign: {
    accent: '#0f172a',
    muted: 'rgba(15, 23, 42, 0.08)',
    subtle: 'rgba(15, 23, 42, 0.04)',
    border: 'rgba(15, 23, 42, 0.25)',
    hover: '#1e293b',
    ring: 'rgba(15, 23, 42, 0.20)',
    glow: 'rgba(15, 23, 42, 0.15)',
    contrast: '#ffffff',
    dots: 'rgba(15, 23, 42, 0.25)',
  },
  obsidian: {
    accent: '#334155',
    muted: 'rgba(51, 65, 85, 0.10)',
    subtle: 'rgba(51, 65, 85, 0.04)',
    border: 'rgba(51, 65, 85, 0.30)',
    hover: '#1e293b',
    ring: 'rgba(51, 65, 85, 0.25)',
    glow: 'rgba(51, 65, 85, 0.15)',
    contrast: '#ffffff',
    dots: 'rgba(51, 65, 85, 0.30)',
  },
  mythic: {
    accent: '#d97706',
    muted: 'rgba(217, 119, 6, 0.12)',
    subtle: 'rgba(217, 119, 6, 0.04)',
    border: 'rgba(217, 119, 6, 0.35)',
    hover: '#b45309',
    ring: 'rgba(217, 119, 6, 0.25)',
    glow: 'rgba(217, 119, 6, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(217, 119, 6, 0.35)',
  },
  cyber: {
    accent: '#0284c7',
    muted: 'rgba(2, 132, 199, 0.12)',
    subtle: 'rgba(2, 132, 199, 0.04)',
    border: 'rgba(2, 132, 199, 0.35)',
    hover: '#0369a1',
    ring: 'rgba(2, 132, 199, 0.25)',
    glow: 'rgba(2, 132, 199, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(2, 132, 199, 0.35)',
  },
  crimson: {
    accent: '#e11d48',
    muted: 'rgba(225, 29, 72, 0.12)',
    subtle: 'rgba(225, 29, 72, 0.04)',
    border: 'rgba(225, 29, 72, 0.35)',
    hover: '#be123c',
    ring: 'rgba(225, 29, 72, 0.25)',
    glow: 'rgba(225, 29, 72, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(225, 29, 72, 0.35)',
  },
  hazard: {
    accent: '#ea580c',
    muted: 'rgba(234, 88, 12, 0.12)',
    subtle: 'rgba(234, 88, 12, 0.04)',
    border: 'rgba(234, 88, 12, 0.35)',
    hover: '#c2410c',
    ring: 'rgba(234, 88, 12, 0.25)',
    glow: 'rgba(234, 88, 12, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(234, 88, 12, 0.35)',
  },
  emerald: {
    accent: '#059669',
    muted: 'rgba(5, 150, 105, 0.12)',
    subtle: 'rgba(5, 150, 105, 0.04)',
    border: 'rgba(5, 150, 105, 0.35)',
    hover: '#047857',
    ring: 'rgba(5, 150, 105, 0.25)',
    glow: 'rgba(5, 150, 105, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(5, 150, 105, 0.35)',
  },
  nord: {
    accent: '#5e81ac',
    muted: 'rgba(94, 129, 172, 0.12)',
    subtle: 'rgba(94, 129, 172, 0.04)',
    border: 'rgba(94, 129, 172, 0.35)',
    hover: '#4c566a',
    ring: 'rgba(94, 129, 172, 0.25)',
    glow: 'rgba(94, 129, 172, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(94, 129, 172, 0.35)',
  },
  parchment: {
    accent: '#b58900',
    muted: 'rgba(181, 137, 0, 0.12)',
    subtle: 'rgba(181, 137, 0, 0.04)',
    border: 'rgba(181, 137, 0, 0.35)',
    hover: '#856404',
    ring: 'rgba(181, 137, 0, 0.25)',
    glow: 'rgba(181, 137, 0, 0.20)',
    contrast: '#ffffff',
    dots: 'rgba(181, 137, 0, 0.35)',
  }
}

export interface ThemePaletteRgb {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  750: string;
  800: string;
  850: string;
  900: string;
  950: string;
}

export const THEME_PALETTES: Record<string, { dark: ThemePaletteRgb; light: ThemePaletteRgb }> = {
  amethyst: {
    dark: {
      950: '19 15 28',   // #130f1c - velvety deep dark purple background
      900: '28 22 42',   // #1c162a - rich purple surface, cards, sidebars
      850: '39 31 58',   // #271f3a - elevated inputs, active card backgrounds
      800: '56 44 82',   // #382c52 - subtle violet borders
      750: '76 60 110',  // #4c3c6e - medium violet borders
      700: '98 78 140',  // #624e8c - strong borders
      600: '128 105 178',
      500: '160 140 205',
      400: '190 175 228',
      300: '218 206 242',
      200: '238 230 250',
      100: '250 245 255',
      50: '255 255 255'
    },
    light: {
      950: '250 245 255', // #faf5ff - faint lilac vellum
      900: '255 255 255', // #ffffff - crisp white cards
      850: '243 232 255', // #f3e8ff - soft lilac surface
      800: '233 213 255', // #e9d5ff - borders
      750: '216 180 254',
      700: '192 132 252',
      600: '168 85 247',
      500: '147 51 234',
      400: '126 34 206',
      300: '107 33 168',
      200: '59 7 100',
      100: '36 4 60',
      50: '20 2 35'
    }
  },
  sovereign: {
    dark: {
      950: '9 10 13',
      900: '15 17 22',
      850: '20 23 31',
      800: '27 31 40',
      750: '33 39 50',
      700: '44 51 64',
      600: '67 76 94',
      500: '96 107 129',
      400: '135 147 167',
      300: '180 189 205',
      200: '215 220 228',
      100: '237 240 244',
      50: '248 249 250'
    },
    light: {
      950: '248 250 252',
      900: '255 255 255',
      850: '241 245 249',
      800: '226 232 240',
      750: '218 224 233',
      700: '203 213 225',
      600: '148 163 184',
      500: '100 116 139',
      400: '71 85 105',
      300: '51 65 85',
      200: '30 41 59',
      100: '15 23 42',
      50: '2 6 23'
    }
  },
  obsidian: {
    dark: {
      950: '8 9 11',
      900: '15 17 21',
      850: '23 26 33',
      800: '35 40 51',
      750: '48 55 69',
      700: '64 73 92',
      600: '88 99 122',
      500: '120 133 158',
      400: '156 168 191',
      300: '194 204 222',
      200: '224 231 242',
      100: '245 248 252',
      50: '255 255 255'
    },
    light: {
      950: '248 250 252',
      900: '255 255 255',
      850: '241 245 249',
      800: '226 232 240',
      750: '203 213 225',
      700: '148 163 184',
      600: '100 116 139',
      500: '71 85 105',
      400: '51 65 85',
      300: '30 41 59',
      200: '15 23 42',
      100: '2 6 23',
      50: '2 6 23'
    }
  },
  mythic: {
    dark: {
      950: '20 17 13',   // #14110d - warm dark umber
      900: '29 24 19',   // #1d1813 - warm dark bronze surface
      850: '41 34 27',   // #29221b - roasted chestnut
      800: '61 51 39',   // #3d3327 - antique bronze borders
      750: '84 70 54',
      700: '110 92 70',
      600: '145 122 93',
      500: '180 154 120',
      400: '212 186 149',
      300: '235 214 182',
      200: '248 233 209',
      100: '254 246 230',
      50: '255 255 255'
    },
    light: {
      950: '251 247 238', // #fbf7ee - illuminated vellum
      900: '255 255 255',
      850: '245 236 216',
      800: '229 215 184',
      750: '212 195 156',
      700: '186 166 122',
      600: '158 135 88',
      500: '132 106 58',
      400: '104 80 38',
      300: '76 56 22',
      200: '51 36 12',
      100: '30 20 5',
      50: '15 10 2'
    }
  },
  cyber: {
    dark: {
      950: '6 11 18',    // #060b12 - abyssal cyber void
      900: '10 18 30',   // #0a121e - cyber panel surface
      850: '16 28 46',   // #101c2e - elevated console
      800: '24 44 72',   // #182c48 - matrix borders
      750: '34 60 98',
      700: '46 80 128',
      600: '68 110 168',
      500: '96 144 205',
      400: '132 178 235',
      300: '175 212 250',
      200: '215 235 255',
      100: '240 249 255',
      50: '255 255 255'
    },
    light: {
      950: '240 249 255', // #f0f9ff
      900: '255 255 255',
      850: '224 242 254',
      800: '186 230 253',
      750: '125 211 252',
      700: '56 189 248',
      600: '14 165 233',
      500: '2 132 199',
      400: '3 105 161',
      300: '7 89 133',
      200: '12 74 110',
      100: '8 47 73',
      50: '4 25 40'
    }
  },
  crimson: {
    dark: {
      950: '21 9 13',    // #15090d - dark blood-onyx
      900: '31 14 20',   // #1f0e14 - velvet wine surface
      850: '45 20 29',   // #2d141d - elevated crimson
      800: '74 28 42',   // #4a1c2a - ruby borders
      750: '102 38 58',
      700: '135 48 76',
      600: '172 65 98',
      500: '205 92 125',
      400: '232 125 155',
      300: '248 168 190',
      200: '254 205 218',
      100: '255 241 245',
      50: '255 255 255'
    },
    light: {
      950: '255 245 246', // #fff5f6 - rose alabaster
      900: '255 255 255',
      850: '255 228 230',
      800: '254 205 211',
      750: '253 164 175',
      700: '251 113 133',
      600: '244 63 94',
      500: '225 29 72',
      400: '190 18 60',
      300: '159 18 57',
      200: '136 19 55',
      100: '76 5 25',
      50: '40 2 12'
    }
  },
  hazard: {
    dark: {
      950: '18 17 16',   // #121110 - basalt black
      900: '26 24 22',   // #1a1816 - graphite machinery surface
      850: '38 35 32',   // #262320 - elevated iron
      800: '59 54 48',   // #3b3630 - iron rivet borders
      750: '82 74 65',
      700: '110 98 86',
      600: '145 130 115',
      500: '180 162 145',
      400: '212 195 178',
      300: '235 222 208',
      200: '248 239 230',
      100: '255 250 245',
      50: '255 255 255'
    },
    light: {
      950: '250 250 249', // #fafaf9
      900: '255 255 255',
      850: '245 245 244',
      800: '231 229 228',
      750: '214 211 209',
      700: '168 162 158',
      600: '120 113 108',
      500: '87 83 78',
      400: '68 64 60',
      300: '41 37 36',
      200: '28 25 23',
      100: '12 10 9',
      50: '6 5 4'
    }
  },
  emerald: {
    dark: {
      950: '8 20 15',    // #08140f - mossy pine obsidian
      900: '13 30 22',   // #0d1e16 - evergreen surface
      850: '20 45 33',   // #142d21 - elevated spruce
      800: '29 67 50',   // #1d4332 - deep forest borders
      750: '39 90 68',
      700: '50 115 88',
      600: '68 145 112',
      500: '92 178 140',
      400: '128 208 170',
      300: '172 232 202',
      200: '212 247 230',
      100: '240 253 246',
      50: '255 255 255'
    },
    light: {
      950: '240 253 244', // #f0fdf4
      900: '255 255 255',
      850: '220 252 231',
      800: '187 247 208',
      750: '134 239 172',
      700: '74 222 128',
      600: '34 197 94',
      500: '22 163 74',
      400: '21 128 61',
      300: '22 101 52',
      200: '20 83 45',
      100: '5 46 22',
      50: '2 28 12'
    }
  },
  nord: {
    dark: {
      950: '36 41 51',   // #242933 - authentic Nord Polar Night deep background
      900: '46 52 64',   // #2e3440 - Nord surface cards/sidebar
      850: '59 66 82',   // #3b4252 - Nord elevated surface
      800: '67 76 94',   // #434c5e - Nord hairline borders
      750: '76 86 106',
      700: '94 106 130',
      600: '120 133 158',
      500: '150 163 186',
      400: '180 192 212',
      300: '216 222 233',
      200: '229 233 240',
      100: '236 239 244',
      50: '255 255 255'
    },
    light: {
      950: '244 246 249', // #f4f6f9 - Snow Storm
      900: '255 255 255',
      850: '236 239 244',
      800: '220 224 232',
      750: '200 206 218',
      700: '160 170 188',
      600: '120 132 152',
      500: '90 102 122',
      400: '67 76 94',
      300: '46 52 64',
      200: '36 41 51',
      100: '20 24 30',
      50: '10 12 16'
    }
  },
  parchment: {
    dark: {
      950: '23 20 18',   // #171412 - dark calfskin vellum
      900: '33 28 25',   // #211c19 - aged leather surface
      850: '47 40 35',   // #2f2823 - elevated morocco binding
      800: '68 58 50',   // #443a32 - illuminated borders
      750: '92 78 66',
      700: '120 102 86',
      600: '154 132 110',
      500: '188 163 136',
      400: '218 196 168',
      300: '238 221 198',
      200: '250 239 224',
      100: '255 250 242',
      50: '255 255 255'
    },
    light: {
      950: '253 251 247', // #fdfbf7 - genuine vellum
      900: '255 255 255',
      850: '246 240 226',
      800: '234 224 200',
      750: '218 202 168',
      700: '196 174 130',
      600: '168 142 94',
      500: '138 112 64',
      400: '110 86 42',
      300: '82 62 26',
      200: '58 42 16',
      100: '34 24 8',
      50: '18 12 4'
    }
  }
}


// Built-in default starter snippets for Obsidian-like CSS customizability
export const DEFAULT_SNIPPETS: CssSnippet[] = [
  {
    id: 'gilded-headers',
    name: 'Gilded Illuminated Headers',
    enabled: false,
    description: 'Subtly adds gold/accent hairline underline and tracking to article headings.',
    css: `/* Gilded Illuminated Headers Snippet */
.oros-wiki-prose h1, .oros-wiki-prose h2 {
  letter-spacing: 0.02em;
  border-bottom: 1px solid var(--oros-accent-border, rgba(226, 232, 240, 0.3));
}
.oros-wiki-prose h1::before {
  content: '§ ';
  color: var(--oros-accent, #e2e8f0);
  opacity: 0.65;
}`
  },
  {
    id: 'compact-file-tree',
    name: 'Ultra-Compact Directory Tree',
    enabled: false,
    description: 'Compresses folder and item padding in the sidebar for maximum vertical density.',
    css: `/* Ultra-Compact Directory Tree Snippet */
.oros-sidebar-item {
  padding-top: 1px !important;
  padding-bottom: 1px !important;
  font-size: 11px !important;
}`
  },
  {
    id: 'parchment-blockquotes',
    name: 'Antique Manuscript Blockquotes',
    enabled: false,
    description: 'Styles editor and article blockquotes with warm parchment margins and italic serif.',
    css: `/* Antique Manuscript Blockquotes */
.oros-wiki-prose blockquote {
  border-left: 2px solid var(--oros-accent, #f5c542);
  background: var(--oros-accent-subtle, rgba(245, 197, 66, 0.04));
  padding: 0.6rem 1rem;
  border-radius: 0 3px 3px 0;
  font-style: italic;
}`
  }
]

export function parseHex(hexStr: string): RgbColor | null {
  const clean = hexStr.replace('#', '').trim()
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16)
    const g = parseInt(clean[1] + clean[1], 16)
    const b = parseInt(clean[2] + clean[2], 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  if (clean.length === 6) {
    const r = parseInt(clean.substring(0, 2), 16)
    const g = parseInt(clean.substring(2, 4), 16)
    const b = parseInt(clean.substring(4, 6), 16)
    if (isNaN(r) || isNaN(g) || isNaN(b)) return null
    return { r, g, b }
  }
  return null
}

export function lighten(rgb: RgbColor, percent: number): string {
  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (255 - rgb.r) * (percent / 100))))
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (255 - rgb.g) * (percent / 100))))
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (255 - rgb.b) * (percent / 100))))
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
}

export function getContrastColor(rgb: RgbColor): string {
  // WCAG relative luminance formula
  const lum = 0.2126 * rgb.r + 0.7152 * rgb.g + 0.0722 * rgb.b
  return lum >= 130 ? '#090a0d' : '#ffffff'
}

export function getThemeTokens(
  theme?: ThemePresetId,
  customColor?: string,
  isLight?: boolean,
  customConfig?: ThemeConfig
): ThemeTokens {
  if (customConfig && customConfig.tokens) {
    const base = isLight ? PRESET_THEMES_LIGHT.sovereign : PRESET_THEMES.sovereign
    return {
      ...base,
      ...customConfig.tokens
    } as ThemeTokens
  }

  const activeTheme = theme || 'sovereign'
  if (activeTheme === 'custom' && customColor) {
    const rgb = parseHex(customColor)
    if (rgb) {
      return {
        accent: customColor,
        muted: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.10 : 0.14})`,
        subtle: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`,
        border: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`,
        hover: isLight ? lighten(rgb, -15) : lighten(rgb, 15),
        ring: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`,
        glow: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`,
        contrast: getContrastColor(rgb),
        dots: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.32 : 0.38})`
      }
    }
  }

  const presetDict = isLight ? PRESET_THEMES_LIGHT : PRESET_THEMES
  return presetDict[activeTheme] || presetDict.sovereign
}

/**
 * Injects or updates individual CSS snippets in document.head
 */
export function applyCssSnippets(snippets: CssSnippet[] = []) {
  if (typeof document === 'undefined') return

  snippets.forEach((snippet) => {
    const elementId = `oros-snippet-${snippet.id}`
    let tag = document.getElementById(elementId) as HTMLStyleElement | null

    if (snippet.enabled && snippet.css && snippet.css.trim().length > 0) {
      if (!tag) {
        tag = document.createElement('style')
        tag.id = elementId
        tag.setAttribute('data-oros-snippet', snippet.id)
        document.head.appendChild(tag)
      }
      if (tag.textContent !== snippet.css) {
        tag.textContent = snippet.css
      }
    } else if (tag) {
      tag.remove()
    }
  })
}

/**
 * Injects custom CSS defined by a ThemeConfig file
 */
export function applyCustomThemeCss(css?: string) {
  if (typeof document === 'undefined') return
  const elementId = 'oros-theme-custom-css'
  let tag = document.getElementById(elementId) as HTMLStyleElement | null

  if (css && css.trim().length > 0) {
    if (!tag) {
      tag = document.createElement('style')
      tag.id = elementId
      document.head.appendChild(tag)
    }
    if (tag.textContent !== css) {
      tag.textContent = css
    }
  } else if (tag) {
    tag.remove()
  }
}

/**
 * Primary theme applicator applying variables, tokens, custom CSS and snippets.
 */
export function applyTheme(
  theme?: ThemePresetId,
  customColor?: string,
  customConfig?: ThemeConfig,
  snippets?: CssSnippet[]
) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  const isLight = root.getAttribute('data-color-mode') === 'light'
  const activeTheme = theme || 'sovereign'

  // Apply full background, surface, border, and text palette custom properties
  const palette = (THEME_PALETTES[activeTheme] || THEME_PALETTES.sovereign)[isLight ? 'light' : 'dark']
  root.style.setProperty('--oros-50-rgb', palette[50])
  root.style.setProperty('--oros-100-rgb', palette[100])
  root.style.setProperty('--oros-200-rgb', palette[200])
  root.style.setProperty('--oros-300-rgb', palette[300])
  root.style.setProperty('--oros-400-rgb', palette[400])
  root.style.setProperty('--oros-500-rgb', palette[500])
  root.style.setProperty('--oros-600-rgb', palette[600])
  root.style.setProperty('--oros-700-rgb', palette[700])
  root.style.setProperty('--oros-750-rgb', palette[750])
  root.style.setProperty('--oros-800-rgb', palette[800])
  root.style.setProperty('--oros-850-rgb', palette[850])
  root.style.setProperty('--oros-900-rgb', palette[900])
  root.style.setProperty('--oros-950-rgb', palette[950])

  // If a custom imported theme configuration is active
  if (customConfig && customConfig.tokens) {
    const tokens = getThemeTokens(undefined, undefined, isLight, customConfig)
    root.setAttribute('data-theme', customConfig.id || 'custom-config')
    root.style.setProperty('--oros-accent', tokens.accent)
    root.style.setProperty('--oros-accent-muted', tokens.muted)
    root.style.setProperty('--oros-accent-subtle', tokens.subtle)
    root.style.setProperty('--oros-accent-border', tokens.border)
    root.style.setProperty('--oros-accent-hover', tokens.hover)
    root.style.setProperty('--oros-accent-ring', tokens.ring)
    root.style.setProperty('--oros-accent-glow', tokens.glow)
    root.style.setProperty('--oros-accent-contrast', tokens.contrast)
    root.style.setProperty('--oros-accent-dots', tokens.dots)

    // Optional surface overrides
    if (tokens.bgApp) root.style.setProperty('--oros-bg-app', tokens.bgApp)
    if (tokens.bgSurface) root.style.setProperty('--oros-bg-surface', tokens.bgSurface)

    applyCustomThemeCss(customConfig.customCss)
    if (snippets) applyCssSnippets(snippets)
    return
  }

  // Clear custom theme CSS if using standard presets
  applyCustomThemeCss(undefined)

  if (activeTheme === 'custom' && customColor) {
    const rgb = parseHex(customColor)
    if (rgb) {
      root.setAttribute('data-theme', 'custom')
      root.style.setProperty('--oros-accent', customColor)
      root.style.setProperty('--oros-accent-muted', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.10 : 0.14})`)
      root.style.setProperty('--oros-accent-subtle', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`)
      root.style.setProperty('--oros-accent-border', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`)
      root.style.setProperty('--oros-accent-hover', isLight ? lighten(rgb, -15) : lighten(rgb, 15))
      root.style.setProperty('--oros-accent-ring', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)`)
      root.style.setProperty('--oros-accent-glow', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`)
      root.style.setProperty('--oros-accent-contrast', getContrastColor(rgb))
      root.style.setProperty('--oros-accent-dots', `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${isLight ? 0.32 : 0.38})`)
      if (snippets) applyCssSnippets(snippets)
      return
    }
  }

  const presetDict = isLight ? PRESET_THEMES_LIGHT : PRESET_THEMES
  const preset = presetDict[activeTheme] || presetDict.sovereign
  root.setAttribute('data-theme', activeTheme)
  root.style.setProperty('--oros-accent', preset.accent)
  root.style.setProperty('--oros-accent-muted', preset.muted)
  root.style.setProperty('--oros-accent-subtle', preset.subtle)
  root.style.setProperty('--oros-accent-border', preset.border)
  root.style.setProperty('--oros-accent-hover', preset.hover)
  root.style.setProperty('--oros-accent-ring', preset.ring)
  root.style.setProperty('--oros-accent-glow', preset.glow)
  root.style.setProperty('--oros-accent-contrast', preset.contrast)
  root.style.setProperty('--oros-accent-dots', preset.dots)

  if (snippets) applyCssSnippets(snippets)
}

// ==========================================
// THEME & SNIPPET IMPORT / EXPORT UTILITIES
// ==========================================

export function exportThemeToJson(theme: ThemeConfig): string {
  return JSON.stringify(theme, null, 2)
}

export function parseThemeFromJson(jsonStr: string): { success: boolean; theme?: ThemeConfig; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'Invalid JSON structure' }
    }
    if (!parsed.id || !parsed.name) {
      return { success: false, error: 'Theme must specify an "id" and "name"' }
    }
    if (!parsed.tokens || typeof parsed.tokens !== 'object') {
      return { success: false, error: 'Theme must provide a "tokens" object' }
    }

    const theme: ThemeConfig = {
      id: String(parsed.id).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
      name: String(parsed.name).trim(),
      author: parsed.author ? String(parsed.author).trim() : 'Community',
      version: parsed.version ? String(parsed.version).trim() : '1.0.0',
      description: parsed.description ? String(parsed.description).trim() : '',
      colorMode: parsed.colorMode === 'light' ? 'light' : 'dark',
      tokens: parsed.tokens,
      customCss: parsed.customCss ? String(parsed.customCss) : undefined
    }

    return { success: true, theme }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON file' }
  }
}

export function exportSnippetsToJson(snippets: CssSnippet[]): string {
  return JSON.stringify(snippets, null, 2)
}

export function parseSnippetsFromJson(jsonStr: string): { success: boolean; snippets?: CssSnippet[]; error?: string } {
  try {
    const parsed = JSON.parse(jsonStr)
    const list = Array.isArray(parsed) ? parsed : [parsed]
    const snippets: CssSnippet[] = []

    for (const item of list) {
      if (item && typeof item === 'object' && item.name && typeof item.css === 'string') {
        snippets.push({
          id: item.id ? String(item.id).trim() : `snippet-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: String(item.name).trim(),
          enabled: Boolean(item.enabled ?? true),
          css: String(item.css),
          description: item.description ? String(item.description) : undefined,
          updatedAt: new Date().toISOString()
        })
      }
    }

    if (snippets.length === 0) {
      return { success: false, error: 'No valid snippets found in JSON' }
    }

    return { success: true, snippets }
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to parse JSON' }
  }
}
