import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter,
  DirectoryFolder, DirectoryItem, WhiteboardCanvasData, WorkspaceTab
} from '@shared/types'

export const sampleWorld: World = {
  id: 'world-aethelgard',
  name: 'Aethelgard: The Shattered Realm',
  tagline: 'An ancient continent fractured by the Cataclysm of Stars, held together by ley-chains.',
  description: 'Aethelgard was once a unified empire under the Solar Concord. Following the celestial rupture four centuries ago, the land fragmented into levitating archipelago regions and deep crystalline rifts.',
  genre: 'Epic High Fantasy',
  bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export const sampleEntities: LoreEntity[] = [
  {
    id: 'char-ronald',
    worldId: 'world-aethelgard',
    title: 'High King Ronald III',
    type: 'character',
    summary: 'The 14th Sovereign of the Solar Bastion and Bearer of the Dawn Brand.',
    content: `<h2>Early Life & Ascension</h2><p>Born during the Solar Eclipse of Year 812, <strong>Ronald III</strong> was trained by the Grand Archivists from age six. His ascension to the Sunken Throne followed the mysterious vanishing of his mother, Queen Katherine.</p><h2>The Leyline Reclamation</h2><p>In the third year of his reign, Ronald commanded the legendary expedition into the <em>Whisperwood</em>, establishing the northern defensive bulwark against incursions from the Obsidian Syndicate.</p><blockquote>"Let the stars shatter; our oaths shall remain unbroken as bedrock." — Ronald III at his coronation.</blockquote><h2>Personal Life</h2><p>Married to Lady Vespera in Year 830, sealing the historic pact between the Solar Bastion and the Weaver Faction.</p>`,
    tags: ['Royalty', 'Solar Bastion', 'Ruler', 'Mage'],
    aliases: ['The Dawn King', 'Ronald the Steadfast'],
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: '14th High King of the Solar Bastion',
      sections: [
        {
          title: 'Monarchial Profile',
          fields: [
            { id: 'f1', label: 'Reign', value: '828 AC – Present', type: 'text' },
            { id: 'f2', label: 'Predecessor', value: 'Queen Katherine II', type: 'text' },
            { id: 'f3', label: 'Dynasty', value: 'House of Auror', type: 'text' },
            { id: 'f4', label: 'Spouse', value: 'Lady Vespera', type: 'entity-link', targetEntityId: 'char-vespera' }
          ]
        },
        {
          title: 'Personal Attributes',
          fields: [
            { id: 'f5', label: 'Born', value: '812 AC (Age 42)', type: 'text' },
            { id: 'f6', label: 'Allegiance', value: 'Solar Concord', type: 'entity-link', targetEntityId: 'fac-solar' },
            { id: 'f7', label: 'Magic Affinity', value: 'Solar / Ley-Harmonics', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-vespera',
    worldId: 'world-aethelgard',
    title: 'Lady Vespera the Weaver',
    type: 'character',
    summary: 'High Priestess of the Astral Loom and Queen Consort of the Solar Bastion.',
    content: `<h2>Origins & Secret Mastery</h2><p><strong>Lady Vespera</strong> was discovered in the crystalline caverns of Mount Oros at age ten, clutching a fragment of the Star-Core. She mastered the art of <em>Ley-Weaving</em> before her sixteenth summer.</p><h2>Influence on Court Politics</h2><p>Vespera serves as Ronald's chief counselor and spymaster, balancing diplomatic tensions between the merchant princes and the arcane conclave.</p>`,
    tags: ['Royalty', 'Spellcaster', 'Diplomat'],
    aliases: ['The Silk Seer', 'Lady of the Loom'],
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'High Priestess of the Loom & Queen Consort',
      sections: [
        {
          title: 'Titles & Titles',
          fields: [
            { id: 'v1', label: 'Title', value: 'Queen Consort & Astral Weaver', type: 'text' },
            { id: 'v2', label: 'Affiliation', value: 'Order of the Silver Quill', type: 'entity-link', targetEntityId: 'fac-quill' },
            { id: 'v3', label: 'Spouse', value: 'High King Ronald III', type: 'entity-link', targetEntityId: 'char-ronald' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-katherine',
    worldId: 'world-aethelgard',
    title: 'Queen Katherine II',
    type: 'character',
    summary: 'The 13th Sovereign and mother of High King Ronald III.',
    content: `<p>Queen Katherine II reigned during the Great Consolidation. Her mysterious disappearance during a survey of the Radiant Abyss remains the kingdom's greatest unsolved enigma.</p>`,
    tags: ['Royalty', 'Ancestor', 'Monarch'],
    aliases: ['The Vanished Queen'],
    avatar: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'Dowager Queen',
      sections: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-marcus',
    worldId: 'world-aethelgard',
    title: 'Lord Marcus',
    type: 'character',
    summary: 'Estranged brother of Ronald III and commander of the Northern Outcasts.',
    content: `<p>Banished to the Frost Marches following his refusal to accept Ronald's coronation. Maintains a bitter claim to the throne.</p>`,
    tags: ['Royalty', 'Exile', 'Rival'],
    aliases: ['The Disinherited'],
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'Exiled Scion',
      sections: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-aurelius',
    worldId: 'world-aethelgard',
    title: 'Prince Aurelius',
    type: 'character',
    summary: 'Crown Prince and heir of High King Ronald III and Lady Vespera.',
    content: `<p>Trained in both swordcraft and star-weaving, Aurelius is the recognized heir to the Sunken Throne.</p>`,
    tags: ['Royalty', 'Crown Prince', 'Heir'],
    aliases: ['The Golden Heir'],
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'Heir Apparent',
      sections: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-lyra',
    worldId: 'world-aethelgard',
    title: 'Lady Lyra',
    type: 'character',
    summary: 'Adopted daughter of Queen Vespera, discovered in the astral ruins.',
    content: `<p>A prodigy with intuitive knowledge of forgotten glyphs, taken under Vespera's personal wardship.</p>`,
    tags: ['Ward', 'Scholar'],
    aliases: ['The Star Ward'],
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'Royal Ward',
      sections: []
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'loc-sunken-bastion',
    worldId: 'world-aethelgard',
    title: 'Citadel of Sunken Gold',
    type: 'location',
    summary: 'The ancient capital city erected atop a floating titanium monolith.',
    content: `<h2>Architecture & Defenses</h2><p>Suspended 1,200 meters above the Radiant Abyss, the <strong>Citadel of Sunken Gold</strong> is anchored by four massive adamantine chains rooted into the continent's seabed.</p><h2>Districts</h2><ul><li><strong>The Upper Spire:</strong> Seat of the Solar Court and royal observatory.</li><li><strong>The Caelum Basin:</strong> Aqueducts fed by condensed cloud-vapors.</li><li><strong>The Low Gantry:</strong> Airship docks for merchants traveling between archipelagos.</li></ul>`,
    tags: ['Capital', 'Fortress', 'Airship Port'],
    aliases: ['Auror Prime', 'The Gilded Anchor'],
    avatar: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    infobox: {
      subtitle: 'Metropolis & Sovereign Capital',
      sections: [
        {
          title: 'Geographic Data',
          fields: [
            { id: 'g1', label: 'Elevation', value: '1,200m above Abyss', type: 'text' },
            { id: 'g2', label: 'Population', value: '380,000 citizens', type: 'text' },
            { id: 'g3', label: 'Governing Body', value: 'Solar Court of Ronald III', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-solar',
    worldId: 'world-aethelgard',
    title: 'The Solar Concord',
    type: 'faction',
    summary: 'The premier geopolitical federation safeguarding the surviving continental fragments.',
    content: `<p>Established in the wake of the Great Rupture, the <strong>Solar Concord</strong> unites three principal kingdoms under a shared defensive treaty and currency standard.</p>`,
    tags: ['Government', 'Military', 'Alliance'],
    aliases: ['The Gilded League'],
    avatar: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=600&q=80',
    infobox: {
      subtitle: 'Continental Coalition',
      sections: [
        {
          title: 'Organization Details',
          fields: [
            { id: 'f1', label: 'Leader', value: 'High King Ronald III', type: 'entity-link', targetEntityId: 'char-ronald' },
            { id: 'f2', label: 'Headquarters', value: 'Citadel of Sunken Gold', type: 'entity-link', targetEntityId: 'loc-sunken-bastion' },
            { id: 'f3', label: 'Motto', value: 'Through Ruin, Light Reigns', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-astral-crown',
    worldId: 'world-aethelgard',
    title: 'The Crown of Astral Glass',
    type: 'item',
    summary: 'A legendary headpiece forged from meteoritic prism-crystal, capable of magnifying thought into kinetic wards.',
    content: `<p>Crafted by the First Artificers during the Golden Era. When worn by a sovereign attuned to solar frequencies, it generates an impenetrable barrier across an entire fortress tier.</p>`,
    tags: ['Relic', 'Artifact', 'Royal Insignia'],
    aliases: ['The Prism Diadem'],
    avatar: 'https://images.unsplash.com/photo-1535295972055-1c762f4483e5?auto=format&fit=crop&w=600&q=80',
    infobox: {
      subtitle: 'Sovereign Arcane Artifact',
      sections: [
        {
          title: 'Properties',
          fields: [
            { id: 'p1', label: 'Current Possessor', value: 'High King Ronald III', type: 'entity-link', targetEntityId: 'char-ronald' },
            { id: 'p2', label: 'Material', value: 'Starlight Prism Quartz', type: 'text' },
            { id: 'p3', label: 'Rarity', value: 'One-of-a-kind (Mythic)', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleMap: WorldMap = {
  id: 'map-aethelgard-main',
  worldId: 'world-aethelgard',
  name: 'Continent of Aethelgard & The Archipelagos',
  description: 'Detailed cartographic projection of the northern sky-isles and the Radiant Abyss.',
  imageUrl: 'https://images.unsplash.com/photo-1524654458049-e36be0721fa2?auto=format&fit=crop&w=1920&q=80',
  scaleUnit: 'Leagues',
  pins: [
    {
      id: 'pin-1',
      mapId: 'map-aethelgard-main',
      x: 48,
      y: 35,
      title: 'Citadel of Sunken Gold',
      description: 'Capital seat of High King Ronald III',
      entityId: 'loc-sunken-bastion',
      color: '#f5c542',
      icon: 'Castle'
    },
    {
      id: 'pin-2',
      mapId: 'map-aethelgard-main',
      x: 72,
      y: 58,
      title: 'The Whisperwood Expanse',
      description: 'Enchanted forest of sentient iron-trees',
      color: '#34d399',
      icon: 'Trees'
    },
    {
      id: 'pin-3',
      mapId: 'map-aethelgard-main',
      x: 28,
      y: 72,
      title: 'The Obsidian Rift',
      description: 'Chasm where gravity fails',
      color: '#f87171',
      icon: 'Skull'
    }
  ],
  regions: [
    {
      id: 'reg-solar-dominion',
      mapId: 'map-aethelgard-main',
      name: 'The Solar Realm',
      points: [[40, 25], [58, 22], [62, 45], [42, 48]],
      color: '#f5c542',
      fillOpacity: 0.18,
      entityId: 'loc-sunken-bastion'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export const sampleRelations: RelationEdge[] = [
  {
    id: 'rel-katherine-ronald',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-katherine',
    targetEntityId: 'char-ronald',
    relationType: 'family',
    label: 'Child',
    icon: 'baby',
    color: '#f59e0b',
    isDashed: false,
    notes: 'Queen Katherine II gave birth to Ronald during the Solar Eclipse'
  },
  {
    id: 'rel-ronald-vespera',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-ronald',
    targetEntityId: 'char-vespera',
    relationType: 'family',
    label: 'Spouse',
    icon: 'heart',
    color: '#f43f5e',
    isDashed: false,
    notes: 'Bound by the Golden Concord of 830 AC'
  },
  {
    id: 'rel-ronald-marcus',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-ronald',
    targetEntityId: 'char-marcus',
    relationType: 'rival',
    label: 'Sibling',
    icon: 'users',
    color: '#94a3b8',
    isDashed: true,
    notes: 'dashed'
  },
  {
    id: 'rel-vespera-aurelius',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-vespera',
    targetEntityId: 'char-aurelius',
    relationType: 'family',
    label: 'Child',
    icon: 'baby',
    color: '#f59e0b',
    isDashed: false,
    notes: 'Crown Prince and biological heir'
  },
  {
    id: 'rel-vespera-lyra',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-vespera',
    targetEntityId: 'char-lyra',
    relationType: 'family',
    label: 'Adopted Child',
    icon: 'handshake',
    color: '#38bdf8',
    isDashed: true,
    notes: 'dashed'
  },
  {
    id: 'rel-ronald-solar',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-ronald',
    targetEntityId: 'fac-solar',
    relationType: 'ruler',
    label: 'High Sovereign',
    icon: 'crown',
    color: '#f5c542',
    isDashed: false,
    notes: 'Supreme Commander'
  },
  {
    id: 'rel-ronald-crown',
    worldId: 'world-aethelgard',
    sourceEntityId: 'char-ronald',
    targetEntityId: 'item-astral-crown',
    relationType: 'creator',
    label: 'Wields Artifact',
    icon: 'gem',
    color: '#c084fc',
    isDashed: false,
    notes: 'Attuned during coronation ritual'
  }
]

export const sampleTimelines: TimelineEvent[] = [
  {
    id: 't-1',
    worldId: 'world-aethelgard',
    era: 'First Age',
    year: 420,
    title: 'The Cataclysm of Stars',
    description: 'A rogue celestial comet fractures the continental mantle into five levitating plates.',
    importance: 'mythic',
    entityIds: []
  },
  {
    id: 't-2',
    worldId: 'world-aethelgard',
    era: 'Age of Concord',
    year: 812,
    title: 'Birth of Ronald III',
    description: 'Born during a celestial alignment at the Citadel of Sunken Gold.',
    importance: 'minor',
    entityIds: ['char-ronald', 'loc-sunken-bastion']
  },
  {
    id: 't-3',
    worldId: 'world-aethelgard',
    era: 'Age of Concord',
    year: 828,
    title: 'Coronation of the Sunken Throne',
    description: 'Ronald III is crowned High King and assumes stewardship over the Crown of Astral Glass.',
    importance: 'major',
    entityIds: ['char-ronald', 'item-astral-crown']
  },
  {
    id: 't-4',
    worldId: 'world-aethelgard',
    era: 'Age of Concord',
    year: 830,
    title: 'The Pact of the Astral Loom',
    description: 'Royal union between Ronald III and Lady Vespera, binding arcane guilds with the Crown.',
    importance: 'major',
    entityIds: ['char-ronald', 'char-vespera']
  }
]

export const sampleManuscript: ManuscriptChapter[] = [
  {
    id: 'ch-1',
    worldId: 'world-aethelgard',
    title: 'Chapter 1: The Chains of Dawn',
    content: `<p>The wind across the titanium gantry screamed in five harmonic keys, each corresponding to an adamantine chain holding the Citadel aloft.</p><p>High King Ronald III touched the cold prism edge of the Crown of Astral Glass. Below him, the clouds curled like slumbering serpents across the mouth of the Radiant Abyss. Lady Vespera stood a pace behind, her fingertips tracing invisible currents through the morning breeze.</p><p>"The scouts from Whisperwood haven't returned, Ronald," she murmured, her voice calm despite the frost clinging to her silver hem.</p><p>"They won't," the King replied. "The Obsidian rift has awakened."</p>`,
    order: 1,
    wordCount: 104,
    updatedAt: new Date().toISOString()
  }
]

export const sampleCanvases: WhiteboardCanvasData[] = [
  {
    id: 'canvas-main',
    worldId: 'world-aethelgard',
    name: 'New Canvas',
    nodes: [
      {
        id: 'node-card-ronald',
        type: 'canvasCard',
        position: { x: 420, y: 220 },
        style: { width: 180, height: 250 },
        data: {
          entityId: 'char-ronald',
          title: 'High King Ronald III',
          subtitle: 'Character',
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
          width: 180,
          height: 250
        }
      },
      {
        id: 'node-note-1',
        type: 'stickyNote',
        position: { x: 630, y: 220 },
        style: { width: 250, height: 200 },
        data: {
          title: 'Title',
          content: 'Write something...',
          width: 250,
          height: 200
        }
      },
      {
        id: 'node-shape-1',
        type: 'shape',
        position: { x: 880, y: 320 },
        style: { width: 160, height: 120 },
        data: {
          shapeType: 'parallelogram',
          color: '#ffffff',
          fillOpacity: 0.95,
          text: '',
          width: 160,
          height: 120
        }
      },
      {
        id: 'node-text-1',
        type: 'canvasText',
        position: { x: 120, y: 500 },
        style: { width: 240, height: 44 },
        data: {
          text: 'Can draw, add cards, texts, shapes, arrows',
          width: 240,
          height: 44
        }
      },
      {
        id: 'node-loop-drawing',
        type: 'canvasDrawing',
        position: { x: 330, y: 120 },
        style: { width: 540, height: 420 },
        data: {
          path: 'M 40 60 C 100 10 340 0 470 30 C 530 80 520 250 490 330 C 400 410 130 420 30 280 C -15 180 0 90 40 60 Z',
          color: '#ffffff',
          width: 540,
          height: 420,
          initialWidth: 540,
          initialHeight: 420,
          strokeWidth: 3.5
        }
      }
    ],
    edges: [],
    strokes: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleFolders: DirectoryFolder[] = [
  {
    id: 'folder-court',
    worldId: 'world-aethelgard',
    name: 'yrtrtrt',
    parentId: null,
    isOpen: true,
    createdAt: new Date().toISOString()
  }
]

export const sampleDirectoryItems: DirectoryItem[] = [
  {
    id: 'doc-canvas-1',
    worldId: 'world-aethelgard',
    name: 'New Canvas',
    type: 'canvas',
    targetId: 'canvas-main',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-timeline-1',
    worldId: 'world-aethelgard',
    name: 'Timeline',
    type: 'timeline',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-rel-1',
    worldId: 'world-aethelgard',
    name: 'Lineage Tree',
    type: 'relations',
    folderId: 'folder-court',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-wiki-1',
    worldId: 'world-aethelgard',
    name: 'Encyclopedia',
    type: 'wiki',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-map-1',
    worldId: 'world-aethelgard',
    name: 'Archipelago Map',
    type: 'map',
    targetId: 'map-aethelgard-main',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'doc-manuscript-1',
    worldId: 'world-aethelgard',
    name: 'Chains of Dawn',
    type: 'writer',
    targetId: 'ch-1',
    folderId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleWorkspaceTabs: WorkspaceTab[] = [
  {
    id: 'tab-relations',
    title: 'Lineage Tree',
    type: 'relations',
    isClosable: true
  },
  {
    id: 'tab-canvas',
    title: 'Whiteboard Canvas',
    type: 'canvas',
    targetId: 'canvas-main',
    isClosable: true
  }
]
