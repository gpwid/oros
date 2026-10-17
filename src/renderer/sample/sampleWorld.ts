import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter,
  DirectoryFolder, DirectoryItem, WhiteboardCanvasData, WorkspaceTab, WorldCalendarConfig
} from '@shared/types'

export const OSTERGARD_CALENDAR_CONFIG: WorldCalendarConfig = {
  firstYear: 800,
  lastYear: 1100,
  yearPrefix: 'Year',
  yearSuffix: 'of the Salt',
  hoursInDay: 24,
  daysOfWeek: [
    'Moonday', 'Tidesday', 'Iron-Day', 'Thornsday', 'Fireday', 'Seaday', 'Sabbath'
  ],
  months: [
    { id: 'm-1', name: 'Frost-Wake', days: 30, season: 'Winter' },
    { id: 'm-2', name: 'Thaw-Melt', days: 30, season: 'Winter' },
    { id: 'm-3', name: 'Seed-Moon', days: 30, season: 'Spring' },
    { id: 'm-4', name: 'Blossom-Tide', days: 30, season: 'Spring' },
    { id: 'm-5', name: 'High-Sun', days: 30, season: 'Spring' },
    { id: 'm-6', name: 'Hay-Harvest', days: 30, season: 'Summer' },
    { id: 'm-7', name: 'Grain-Reaping', days: 30, season: 'Summer' },
    { id: 'm-8', name: 'Salt-Gathering', days: 30, season: 'Summer' },
    { id: 'm-9', name: 'Mist-Fall', days: 30, season: 'Autumn' },
    { id: 'm-10', name: 'Cinder-Night', days: 30, season: 'Autumn' },
    { id: 'm-11', name: 'Deep-Gloom', days: 30, season: 'Autumn' },
    { id: 'm-12', name: 'Bitter-Freeze', days: 30, season: 'Winter' }
  ],
  eras: [
    { id: 'era-1', name: 'The Founding Epoch', startYear: 800, endYear: 920, color: '#64748b' },
    { id: 'era-2', name: 'The Golden Covenant', startYear: 921, endYear: 1010, color: '#d97706' },
    { id: 'era-3', name: 'The Ashen Winter', startYear: 1011, endYear: 1100, color: '#f43f5e' }
  ]
};

export const sampleWorld: World = {
  id: 'world-ostergard',
  name: 'The Ashen Crown: Chronicles of Ostergard',
  tagline: 'A storm-scoured realm of basalt cliffs and salt marshes, bled dry by famine and a dying duke\'s secret.',
  description: 'For three centuries, House Ostergard held the Bitter Coast through iron discipline, herring fleets, and the ancient Salt Covenant. But the Winter of the Drowned Grain has turned the wheat black in the silos, the exiled fleet of Torvald Black-Thorn strikes at coastal supply lines, and with the sudden poisoning of the Old Duke, the basalt throne falls to Corvus the Iron Warden—a scarred frontier soldier surrounded by ambitious merchant oligarchs, fanatic inquisitors, and starving commoners.',
  genre: 'Grounded Grimdark Fantasy',
  calendarConfig: OSTERGARD_CALENDAR_CONFIG,
  bannerUrl: 'https://cdnb.artstation.com/p/assets/images/images/004/018/719/20161118215036/large/shahab-alizadeh-storm-coast.jpg',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export const sampleEntities: LoreEntity[] = [
  {
    id: 'char-corvus',
    worldId: 'world-ostergard',
    title: 'Lord Corvus Ostergard',
    type: 'character',
    summary: 'The 11th High Duke of Ostergard, a scarred veteran of the Northern Wall thrust onto the basalt throne.',
    content: `<h2>The Frontier Years</h2><p>For nineteen winters, <strong>Corvus Ostergard</strong> never set foot in the capital. While his elder brother Julian learned the courtly subtleties of falconry and high statecraft, Corvus was stationed at Dun Craigh—the wind-whipped garrison anchoring the Northern Wall against seasonal reavers. The deep frost-scar across his left cheekbone was earned during the Breach of the Low Skerries.</p><h2>The Sudden Succession</h2><p>The sovereign succession was never meant for him. When Duke Vane collapsed during the Feast of Saint Jude vomiting blackened bile, the crown should have passed to Julian. But Julian's body had been pulled from the harbor reeds three nights prior, his throat cut from ear to ear with a gutting knife. Corvus rode through four blizzards with eighty mounted border-lances to claim the throne before the merchant guilds could proclaim a regency council.</p><blockquote>"Bread will calm a starving mob faster than ten thousand pikes. But gold cannot bake wheat, and our silos are empty." — Corvus to the Ducal Council</blockquote><h2>Demeanor & Rule</h2><p>Corvus conducts affairs of state wearing boiled leather and a rusted chain-collar rather than ermine robes. He disdains rhetorical flourish, trusting only signed manifests, dry grain stores, and sharpened iron.</p>`,
    tags: ['Ruler', 'House Ostergard', 'Veteran', 'Commander'],
    aliases: ['The Iron Warden', 'Corvus the Silent', 'The Bastard of Dun Craigh'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/055/059/504/large/dmitry-ork-d4-portret-king-14102022.jpg?1666027507',
    infobox: {
      subtitle: '11th Sovereign Duke of the Bitter Coast',
      sections: [
        {
          title: 'Sovereign Attributes',
          fields: [
            { id: 'c1', label: 'Reign', value: '1021 of the Salt – Present', type: 'text' },
            { id: 'c2', label: 'House', value: 'House Ostergard', type: 'entity-link', targetEntityId: 'fac-house-ostergard' },
            { id: 'c3', label: 'Seat', value: 'Citadel of Dun Carrow', type: 'entity-link', targetEntityId: 'loc-dun-carrow' },
            { id: 'c4', label: 'Personal Weapon', value: 'Widow\'s Weight (Bog-iron)', type: 'entity-link', targetEntityId: 'item-widows-weight' }
          ]
        },
        {
          title: 'Genealogy & Blood',
          fields: [
            { id: 'c5', label: 'Father', value: 'Duke Vane Ostergard (Deceased)', type: 'entity-link', targetEntityId: 'char-vane' },
            { id: 'c6', label: 'Brother', value: 'Julian Ostergard (Murdered)', type: 'entity-link', targetEntityId: 'char-julian' },
            { id: 'c7', label: 'Blood-Brother', value: 'Torvald Black-Thorn', type: 'entity-link', targetEntityId: 'char-torvald' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-lysandra',
    worldId: 'world-ostergard',
    title: 'Lady Lysandra Vance',
    type: 'character',
    summary: 'Chancellor of the Exchequer and master of the realm\'s dwindling grain manifests.',
    content: `<h2>Rise from the Wharf Guilds</h2><p><strong>Lady Lysandra</strong> was born to a common timber merchant in the Lower Docks. Widowed at twenty-six when the aged High Steward Vance died of winter fever, she assumed control of the Exchequer by virtue of being the only person in the Ducal Court capable of auditing forty years of double-entry maritime ledgers.</p><h2>The Secret Granaries</h2><p>While the city rioted over bread shortages, Lysandra quietly orchestrated the purchase of grain from southern smuggler galleys. <span class="oros-spoiler" data-spoiler="true">She has concealed twelve thousand bushels of dried rye inside the salt-mines below the Weeping Bastion, rationing it secretly to keep the dock garrisons loyal while letting the oligarchs believe the realm is destitute.</span></p><h2>Relationship with the Warden</h2><p>She is the only counselor who speaks plainly to Duke Corvus. While Corvus understands tactical maneuvers and pike formations, Lysandra understands that a kingdom is conquered by tariffs, grain rot, and unpaid loans.</p>`,
    tags: ['Chancellor', 'Exchequer', 'Diplomat', 'Courtier'],
    aliases: ['The Silver Finch', 'The Ledger Mistress'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/058/323/244/large/eduardo-fernandez-baca-garcia-bstsuz-7ebe2bc3a992c1771b428e846.jpg?1673902936',
    infobox: {
      subtitle: 'High Chancellor of the Bitter Coast',
      sections: [
        {
          title: 'Office Profile',
          fields: [
            { id: 'l1', label: 'Title', value: 'Chancellor of the Exchequer', type: 'text' },
            { id: 'l2', label: 'Affiliation', value: 'The Salt Covenant', type: 'entity-link', targetEntityId: 'fac-salt-covenant' },
            { id: 'l3', label: 'Residence', value: 'The High Gantry Manor', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-torvald',
    worldId: 'world-ostergard',
    title: 'Torvald Black-Thorn',
    type: 'character',
    summary: 'Exiled admiral of the High Fleet, turned corsair warlord of the Skell Archipelago.',
    content: `<h2>The Mutiny of the Red Shallows</h2><p>Ten winters ago, <strong>Torvald</strong> commanded the Ducal Flagship <em>The Sea-Hag</em>. When Duke Vane ordered him to firebomb a coastal fishing hamlet suspected of harboring dock-fever, Torvald threw the Duke's inquisitor overboard, severed the anchor cable, and sailed north with four royal galleys.</p><h2>The Skell Brotherhood</h2><p>From the storm-battered sea-caves of the Skell Archipelago, Torvald has organized an armada of sixty longships. He levies "tithes" on any merchant vessel attempting to navigate the northern straits without his branded seal.</p><h2>The Blood Covenant</h2><p>In their youth, Torvald and Corvus swore blood-brotherhood beneath the megaliths of Mor. Though Torvald's raiders now skirmish with Corvus's coastal patrols, neither man has ever sanctioned an assassin against the other.</p>`,
    tags: ['Reaver', 'Outcast', 'Admiral', 'Rival'],
    aliases: ['The Sea-Wolf', 'The Reaver of Skell'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/014/956/916/20190102165241/large/labros-panousis-viking-portrait.jpg',
    infobox: {
      subtitle: 'Admiral of the Skell Reavers',
      sections: [
        {
          title: 'Naval Command',
          fields: [
            { id: 't1', label: 'Flagship', value: 'The Iron Cormorant', type: 'text' },
            { id: 't2', label: 'Fleet Strength', value: '42 Longships, 6 Galleasses', type: 'text' },
            { id: 't3', label: 'Base', value: 'Skell Haven', type: 'entity-link', targetEntityId: 'loc-skell-isles' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-morwenna',
    worldId: 'world-ostergard',
    title: 'Arch-Inquisitor Morwenna',
    type: 'character',
    summary: 'Suprema of the Ashen Liturgy, preaching divine retribution for foreign trade.',
    content: `<h2>Ascetic Fanaticism</h2><p><strong>Morwenna</strong> walks barefoot across the brine-washed flagging of the cathedral square, clad in coarse unbleached wool. She claims the black rot consuming the barley fields is holy punishment for Ostergard's trade with pagan sea-tribes.</p><h2>The Sisters of the Cinder</h2><p>She commands the monastic militia known as the <em>Sisters of the Cinder</em>, armed with ash-hardened quarterstaves and brands. She has publicly condemned two merchant oligarchs to the salt-kilns and openly challenges Corvus's authority to levy grain from church tithe-barns.</p>`,
    tags: ['Clergy', 'Inquisition', 'Religious Leader'],
    aliases: ['The Ashen Mother', 'The Salt Prophet'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/079/558/668/20240902012523/large/francis-brunet-false-prophet2-3.jpg',
    infobox: {
      subtitle: 'Suprema of the Ashen Liturgy',
      sections: [
        {
          title: 'Ecclesiastical Office',
          fields: [
            { id: 'm1', label: 'Order', value: 'The Ashen Liturgy', type: 'entity-link', targetEntityId: 'fac-ashen-liturgy' },
            { id: 'm2', label: 'Sanctuary', value: 'The Cathedral of Salt & Cinder', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-vane',
    worldId: 'world-ostergard',
    title: 'Duke Vane Ostergard',
    type: 'character',
    summary: 'The 10th Duke of Ostergard, whose authoritarian thirty-year rule ended in poisoning.',
    content: `<p>A paranoid and calculating autocrat, <strong>Duke Vane</strong> centralized taxation, crushed peasant uprisings, and amassed a private hoard of silver bullion while the frontier fell into disrepair. His death during the harvest banquet remains an open murder investigation in the council chamber.</p>`,
    tags: ['Royalty', 'Deceased', 'House Ostergard'],
    aliases: ['The Old Duke', 'Vane the Miser'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/015/991/988/large/vinicius-bortoletto-5-portrait.jpg',
    infobox: { subtitle: 'Late Sovereign Duke (Deceased)', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-julian',
    worldId: 'world-ostergard',
    title: 'Julian Ostergard',
    type: 'character',
    summary: 'The refined elder son of Duke Vane, murdered on the eve of his coronation.',
    content: `<p>Charming, cultured, and beloved by the capital's merchant guilds, <strong>Julian</strong> was poised to usher in an era of reconciliation with the southern realms. His throat was slashed in an alleyway outside the counting-houses three nights before his father's death, plunging the realm into succession chaos.</p>`,
    tags: ['Nobility', 'Deceased', 'Heir'],
    aliases: ['The Drowned Heir', 'Julian the Fair'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/085/428/636/large/oleg-seleznev-kcd-portaits5.jpg',
    infobox: { subtitle: 'Crown Heir (Murdered)', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'loc-dun-carrow',
    worldId: 'world-ostergard',
    title: 'The Citadel of Dun Carrow',
    type: 'location',
    summary: 'The seven-century-old basalt fortress hammered into the stormy sea cliffs of the Bitter Coast.',
    content: `<h2>Architecture & Fortifications</h2><p>Towering forty fathoms above the churning black waves, <strong>Dun Carrow</strong> was built from cyclopean basalt blocks bound with a mortar of pulverized whalebone and lime. Its sea-gates feature triple portcullises that allow warships to dock inside vaulted tidal caverns safe from Atlantic storms.</p><h2>Key Bastions</h2><ul><li><strong>The High Battery:</strong> Positioned atop the northern crag, mounting heavy counterweight mangonels.</li><li><strong>The Drowned Docks:</strong> Subterranean slipways where shipwrights caulk oak hulls by lantern light.</li><li><strong>The Cinder Chamber:</strong> The council hall where the peat fire has burned continuously since the reign of Duke Alden I.</li></ul>`,
    tags: ['Fortress', 'Capital', 'Naval Port'],
    aliases: ['The Black Keep', 'The Sea-Spire'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/001/749/310/large/j-c-park-cliff-castle.jpg',
    infobox: {
      subtitle: 'Seat of Sovereign Authority',
      sections: [
        {
          title: 'Fortress Data',
          fields: [
            { id: 'd1', label: 'Elevation', value: '180m above sea level', type: 'text' },
            { id: 'd2', label: 'Garrison', value: '1,400 Footmen, 300 Crossbows', type: 'text' },
            { id: 'd3', label: 'Ruler', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'loc-mor-marshes',
    worldId: 'world-ostergard',
    title: 'The Salt Marshes of Mor',
    type: 'location',
    summary: 'A desolate expanse of brackish fens, peat trenches, and prehistoric megaliths.',
    content: `<p>Stretching thirty leagues south of Dun Carrow, the <strong>Marshes of Mor</strong> are traversed only by plank-roads and skiffs. Peat-cutters frequently dredge up bronze daggers and mummified corpses preserved in the acidic brine. It is the primary haven for grain smugglers avoiding ducal tariffs.</p>`,
    tags: ['Wilderness', 'Swamp', 'Smuggling'],
    aliases: ['The Weeping Fens', 'The Drowned Mor'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/096/589/115/smaller_square/alejandro-mendez-giga-board-and-card-game-art-17-01-standard-v2-1500h.webp',
    infobox: { subtitle: 'Brackish Wetland Territory', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'loc-skell-isles',
    worldId: 'world-ostergard',
    title: 'The Skell Archipelago',
    type: 'location',
    summary: 'A jagged chain of granite islets that serve as the stronghold of Torvald\'s corsair fleet.',
    content: `<p>Surrounded by ship-killing reefs and perpetual sea-fog, the <strong>Skell Isles</strong> are inaccessible to deep-draft galleys. Torvald's raiders operate slipways and smokehouses along the sheltered inlets of Skell Haven, trading looted grain for southern weapons.</p>`,
    tags: ['Archipelago', 'Pirate Haven', 'Island'],
    aliases: ['The Wolf Skerries'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/012/261/532/large/mitch-aseltine-coast-final-01-ma.jpg',
    infobox: { subtitle: 'Independent Corsair Stronghold', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-house-ostergard',
    worldId: 'world-ostergard',
    title: 'House Ostergard',
    type: 'faction',
    summary: 'The ancient ducal dynasty ruling the Bitter Coast since the Great Inundation.',
    content: `<p>Bearing the heraldry of a black sea-eagle clenching an anchor, <strong>House Ostergard</strong> made its fortune through salt mines, timber exports, and coastal warfare. Centuries of inbreeding and frontier conflict have reduced the legitimate lineage down to Lord Corvus.</p>`,
    tags: ['Dynasty', 'Noble House', 'Sovereigns'],
    aliases: ['The Sea-Eagle Lords'],
    avatar: 'https://cdna.artstation.com/p/assets/covers/images/085/428/876/large/oleg-seleznev-oleg-seleznev-kcd-portaits5.jpg',
    infobox: { subtitle: 'Ducal Sovereign Dynasty', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-salt-covenant',
    worldId: 'world-ostergard',
    title: 'The Salt Covenant',
    type: 'faction',
    summary: 'The oligarchic guild syndicate controlling coastal fisheries, salt pans, and sea trade.',
    content: `<p>A confederation of seven merchant families that hold the Ducal Treasury in suffocating debt. Through their control of the brine-pits, the <strong>Covenant</strong> dictates the price of preserved winter food. They privately back Lady Lysandra, believing she will protect their commercial privileges against military seizure.</p>`,
    tags: ['Guild', 'Commerce', 'Oligarchy'],
    aliases: ['The Brine Masters', 'The Merchant Conclave'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/067/948/799/large/olivier-barbeau-render2.jpg',
    infobox: { subtitle: 'Mercantile Syndicate', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-ashen-liturgy',
    worldId: 'world-ostergard',
    title: 'The Ashen Liturgy',
    type: 'faction',
    summary: 'The ascetic state religion venerating the Sacred Hearth and practicing corpse-salting.',
    content: `<p>The dominant faith across Ostergard. The <strong>Liturgy</strong> teaches that moisture breeds rot and spiritual decay; the dead must be salted and dried in cliffside bone-houses so their spirits can join the eternal hearth fire. Under Arch-Inquisitor Morwenna, the faith has grown increasingly militant.</p>`,
    tags: ['Religion', 'Inquisition', 'Church'],
    aliases: ['The Order of the Hearth'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/066/295/913/20230820171142/large/iartist-00006-2062781035-a-40-year-old-female-priestess-wearing-a-hooded-robe-standing-in-an-ancient-temple-ornate-upper-body-cinematic-still-shot-dy-swapped-0000.jpg',
    infobox: { subtitle: 'Orthodox Religious Body', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-black-sigil',
    worldId: 'world-ostergard',
    title: 'The Black-Iron Sigil',
    type: 'item',
    summary: 'The ancestral seal ring of House Ostergard, carved from a meteoritic stone dredged from the sea.',
    content: `<p>A massive signet ring carved from a cold, dense star-iron nodule. The seal bears the deep intaglio relief of the sea-eagle and anchor. By sovereign law, any document pressed with blood-wax from this ring possesses absolute legal enforceability across the Bitter Coast.</p>`,
    tags: ['Artifact', 'Relic', 'Signet Ring'],
    aliases: ['The Eagle Seal', 'The Cold Iron'],
    avatar: 'https://cdna.artstation.com/p/assets/images/images/014/298/174/large/jihun-lee-item-revtel-signet-ring.jpg',
    infobox: {
      subtitle: 'Sovereign Heirloom',
      sections: [
        {
          title: 'Properties',
          fields: [
            { id: 's1', label: 'Wielder', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' },
            { id: 's2', label: 'Material', value: 'Meteoric Star-Iron', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-widows-weight',
    worldId: 'world-ostergard',
    title: 'Widow\'s Weight',
    type: 'item',
    summary: 'Corvus\'s notched broadsword forged from bog-iron and tempered in salt brine.',
    content: `<p>A heavy, utilitarian bastard sword lacking gold filigree or gem inlay. Its blade carries seven distinct notches from the Siege of Dun Craigh. It is balanced for shattering shield-rims and heavy winter mail rather than courtly dueling.</p>`,
    tags: ['Weapon', 'Broadsword'],
    aliases: ['The Bog Blade'],
    avatar: 'https://cdnb.artstation.com/p/assets/images/images/082/499/605/large/claudio-roberto-de-araujo-elementos.jpg',
    infobox: { subtitle: 'Martial Broadsword', sections: [] },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleMap: WorldMap = {
  id: 'map-ostergard-coast',
  worldId: 'world-ostergard',
  name: 'The Bitter Coast & The Skell Archipelago',
  description: 'Detailed maritime chart of the Grand Duchy of Ostergard, showing sea-lanes, coastal beacons, and pirate waters.',
  imageUrl: 'https://cdna.artstation.com/p/assets/images/images/029/553/824/large/robert-altbauer-brandenland.jpg',
  scaleUnit: 'Leagues',
  pins: [
    {
      id: 'pin-1',
      mapId: 'map-ostergard-coast',
      x: 52,
      y: 44,
      title: 'Citadel of Dun Carrow',
      description: 'Ducal stronghold and sovereign seat of House Ostergard',
      entityId: 'loc-dun-carrow',
      color: '#e2e8f0',
      icon: 'Castle'
    },
    {
      id: 'pin-2',
      mapId: 'map-ostergard-coast',
      x: 74,
      y: 62,
      title: 'The Salt Marshes of Mor',
      description: 'Extensive peat cuttings, fog fens, and smuggler waterways',
      entityId: 'loc-mor-marshes',
      color: '#10b981',
      icon: 'Trees'
    },
    {
      id: 'pin-3',
      mapId: 'map-ostergard-coast',
      x: 24,
      y: 28,
      title: 'Skell Haven',
      description: 'Corsair redoubt and longship slipways of Torvald Black-Thorn',
      entityId: 'loc-skell-isles',
      color: '#06b6d4',
      icon: 'Anchor'
    },
    {
      id: 'pin-4',
      mapId: 'map-ostergard-coast',
      x: 42,
      y: 78,
      title: 'The Weeping Beacon',
      description: 'Ancient lighthouse warning merchant galleys away from the razor reefs',
      color: '#f59e0b',
      icon: 'Flame'
    }
  ],
  regions: [
    {
      id: 'reg-ducal-demesne',
      mapId: 'map-ostergard-coast',
      name: 'Ducal Demesne & High Ports',
      points: [[46, 32], [64, 30], [68, 54], [48, 56]],
      color: '#e2e8f0',
      fillOpacity: 0.16,
      entityId: 'loc-dun-carrow'
    },
    {
      id: 'reg-famine-fen',
      mapId: 'map-ostergard-coast',
      name: 'The Famine Marches',
      points: [[68, 52], [86, 50], [88, 76], [70, 78]],
      color: '#f43f5e',
      fillOpacity: 0.18,
      entityId: 'loc-mor-marshes'
    },
    {
      id: 'reg-skell-waters',
      mapId: 'map-ostergard-coast',
      name: 'Reaver Waters',
      points: [[14, 18], [34, 16], [36, 42], [16, 44]],
      color: '#06b6d4',
      fillOpacity: 0.14,
      entityId: 'loc-skell-isles'
    }
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export const sampleRelations: RelationEdge[] = [
  {
    id: 'rel-corvus-vane',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'char-vane',
    relationType: 'family',
    label: 'Father',
    icon: 'crown',
    color: '#64748b',
    isDashed: false,
    notes: 'Nineteen winters of estrangement ended when Vane died poisoned'
  },
  {
    id: 'rel-corvus-julian',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'char-julian',
    relationType: 'family',
    label: 'Brother',
    icon: 'users',
    color: '#f43f5e',
    isDashed: true,
    notes: 'Julian was murdered three nights before their father; Corvus is hunting the killers'
  },
  {
    id: 'rel-corvus-lysandra',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'char-lysandra',
    relationType: 'ally',
    label: 'Uneasy Council',
    icon: 'scale',
    color: '#38bdf8',
    isDashed: false,
    notes: 'Corvus commands the steel; Lysandra controls the grain and loans'
  },
  {
    id: 'rel-corvus-torvald',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'char-torvald',
    relationType: 'rival',
    label: 'Blood-Sworn Brothers',
    icon: 'swords',
    color: '#f59e0b',
    isDashed: true,
    notes: 'Sworn brothers in youth, now warring across the northern sea-lanes'
  },
  {
    id: 'rel-corvus-morwenna',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'char-morwenna',
    relationType: 'rival',
    label: 'Theological Clash',
    icon: 'flame',
    color: '#ef4444',
    isDashed: false,
    notes: 'Morwenna demands heretic executions; Corvus refuses to alienate merchant guilds'
  },
  {
    id: 'rel-corvus-carrow',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'loc-dun-carrow',
    relationType: 'ruler',
    label: 'Ducal Seat',
    icon: 'shield',
    color: '#e2e8f0',
    isDashed: false,
    notes: 'The seat of sovereign power on the Bitter Coast'
  },
  {
    id: 'rel-corvus-sigil',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'item-black-sigil',
    relationType: 'creator',
    label: 'Wields Seal',
    icon: 'gem',
    color: '#94a3b8',
    isDashed: false,
    notes: 'Pledged on his skin during coronation'
  },
  {
    id: 'rel-lysandra-covenant',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-lysandra',
    targetEntityId: 'fac-salt-covenant',
    relationType: 'member',
    label: 'Guild Envoy',
    icon: 'coins',
    color: '#eab308',
    isDashed: false,
    notes: 'Manages guild debt bonds and tariffs'
  },
  {
    id: 'rel-morwenna-liturgy',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-morwenna',
    targetEntityId: 'fac-ashen-liturgy',
    relationType: 'ruler',
    label: 'Suprema',
    icon: 'cross',
    color: '#f97316',
    isDashed: false,
    notes: 'Directs the inquisitors and salt-monasteries'
  }
]

export const sampleTimelines: TimelineEvent[] = [
  {
    id: 't-1',
    worldId: 'world-ostergard',
    era: 'The Founding Epoch',
    isPeriod: false,
    year: 842,
    month: 5,
    day: 18,
    category: 'cultural',
    title: 'Laying of the Basalt Foundation',
    description: 'Duke Alden I commands the raising of Dun Carrow using black stone quarried from the Mor seabed.',
    importance: 'major',
    entityIds: ['loc-dun-carrow', 'fac-house-ostergard']
  },
  {
    id: 't-period-covenant',
    worldId: 'world-ostergard',
    era: 'The Golden Covenant',
    isPeriod: true,
    periodType: 'epoch',
    year: 921,
    endYear: 980,
    category: 'political',
    color: '#d97706',
    title: 'The Salt Prosperity',
    description: 'Six decades of naval expansion, herring commerce, and the establishment of the seven guild counting-houses.',
    importance: 'major',
    entityIds: ['fac-salt-covenant']
  },
  {
    id: 't-period-border',
    worldId: 'world-ostergard',
    era: 'The Golden Covenant',
    isPeriod: true,
    periodType: 'war',
    year: 988,
    endYear: 1005,
    category: 'war',
    color: '#64748b',
    title: 'The Northern Wall Campaigns',
    description: 'Seventeen years of bloody border defense where Corvus earned his command and frost-wound.',
    importance: 'major',
    entityIds: ['char-corvus']
  },
  {
    id: 't-mutiny',
    worldId: 'world-ostergard',
    era: 'The Golden Covenant',
    isPeriod: false,
    year: 1004,
    month: 7,
    day: 12,
    category: 'war',
    title: 'The Mutiny of the Red Shallows',
    description: 'Admiral Torvald defies Duke Vane\'s orders, seizes four galleys, and escapes into the Skell Archipelago.',
    importance: 'major',
    entityIds: ['char-torvald', 'char-vane']
  },
  {
    id: 't-period-famine',
    worldId: 'world-ostergard',
    era: 'The Ashen Winter',
    isPeriod: true,
    periodType: 'epoch',
    year: 1018,
    endYear: 1022,
    category: 'astronomical',
    color: '#ef4444',
    title: 'The Winter of the Drowned Grain',
    description: 'Continuous salt-rains and sea-mists rot the rye harvests; grain silos turn black and bread prices rise tenfold.',
    importance: 'mythic',
    entityIds: ['loc-mor-marshes', 'fac-salt-covenant']
  },
  {
    id: 't-murder-julian',
    worldId: 'world-ostergard',
    era: 'The Ashen Winter',
    isPeriod: false,
    year: 1021,
    month: 9,
    day: 28,
    category: 'birth-death',
    title: 'Murder of Julian the Heir',
    description: 'The elder Ostergard scion is discovered dead in the harbor reeds, plunging the ducal court into panic.',
    importance: 'major',
    entityIds: ['char-julian', 'fac-house-ostergard']
  },
  {
    id: 't-poison-vane',
    worldId: 'world-ostergard',
    era: 'The Ashen Winter',
    isPeriod: false,
    year: 1021,
    month: 10,
    day: 2,
    category: 'birth-death',
    title: 'The Poisoning of Duke Vane',
    description: 'The Old Duke collapses at the Feast of Saint Jude, vomiting black bile before naming his heir.',
    importance: 'major',
    entityIds: ['char-vane']
  },
  {
    id: 't-coronation-corvus',
    worldId: 'world-ostergard',
    era: 'The Ashen Winter',
    isPeriod: false,
    year: 1021,
    month: 10,
    day: 14,
    category: 'political',
    title: 'Coronation of the Iron Warden',
    description: 'Corvus rides into Dun Carrow with eighty lances, assumes the Black-Iron Sigil, and takes the basalt throne.',
    importance: 'major',
    entityIds: ['char-corvus', 'item-black-sigil', 'loc-dun-carrow']
  }
]

export const sampleManuscript: ManuscriptChapter[] = [
  {
    id: 'ch-1',
    worldId: 'world-ostergard',
    title: 'Chapter 1: The Salt on the Blade',
    content: `<p>The sea wind off the Bitter Strait tasted of rust and drowned kelp. It screamed through the embrasures of the High Battery with a sound like dying horses, flinging needles of cold salt-spray against the black basalt ramparts of Dun Carrow.</p>
<p>Lord Corvus Ostergard did not flinch. He leaned his scarred knuckles against the crenellation, watching the grey swell break against the jagged teeth of the Lower Skerries eighty fathoms below. In his nineteen winters along the Northern Wall, he had learned that the cold was not an enemy to be fought, but an auditor that uncovered every flaw in a man's mail and marrow.</p>
<p>"Two more grain-hulks from the Southern Barony ran aground off the Weeping Spit before daybreak, my Lord," a voice said through the wind.</p>
<p>Corvus turned his head slowly. Lady Lysandra Vance stood wrapped in dark lambskin, her silver hair pinned with bone needles against the gale. Under her arm, she clutched the oiled-leather binder that held the daily tally of the realm's slow starvation.</p>
<p>"Were they scuttled?" Corvus asked, his voice harsh from years of shouting over blizzard gales.</p>
<p>"Their rudders were unhung," Lysandra replied smoothly. "Cut clean through with iron saws while they swung at anchor in the roadstead. Torvald's scouts left his branding-chisel hammered into the bowsprit of the lead galley."</p>
<p>Corvus touched the thumb of his left hand. The Black-Iron Sigil was cold against his calloused skin. "Torvald doesn't burn grain. He eats it."</p>
<p>"He didn't burn it, Corvus. He lightered the flour sacks onto three Skell longships before he broached the hulls. Your brother Julian's death bought him the harbor manifests. He knows our granaries have less than six weeks of dry rye remaining before the commons begin boiling harness leather."</p>
<p>Corvus looked past her, toward the lower bailey where three hundred starving dockmen had gathered outside the tithe-gates, their breath rising like smoke into the freezing dawn.</p>
<p>"Then we do not wait for the next convoy," Corvus said, resting his hand on the pommel of <em>Widow's Weight</em>. "Have the harbor chains dropped. Sound the muster at the tide-gate."</p>`,
    order: 1,
    wordCount: 368,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ch-2',
    worldId: 'world-ostergard',
    title: 'Chapter 2: A Ledger of Cold Embers',
    content: `<p>The council chamber smelled of wet wool, burning peat, and tallow. At the head of the oak table, where Duke Vane had sat for thirty winters passing death warrants in his thin, spidery hand, Corvus sat with his broadsword laid unbelted before him.</p>
<p>"It is divine castigation," Arch-Inquisitor Morwenna pronounced. She stood by the narrow slit window, her grey cowl casting deep hollows over her cheekbones. Her fingers clicked restlessly along a rosary of charred bone. "The black fungus on the grain stalks is not a sickness of the soil, Lord Warden. It is the rot of heresy. Your father permitted southern pagans to erect their shrine-stones on the headland in exchange for gold ducats. The Sacred Hearth has withdrawn its warmth."</p>
<p>"The Sacred Hearth does not fill a belly, Mother," Lysandra countered from across the table, dipping her quill into black oak-gall ink. "And your monastic tithe-barns in the High Quarter currently hold four hundred tierces of salt-beef that haven't seen the light of day since autumn."</p>
<p>Morwenna's gaze snapped to the Chancellor, pale eyes burning like coals in the hearth. "That beef is consecrated for the holy funeral kilns. Touch it, Lady Vance, and I will have the bells of the Ashen Liturgy toll a curse across your counting-houses before sundown."</p>
<p>Corvus's fist struck the table. The iron blade of <em>Widow's Weight</em> jumped an inch off the oak planks, ringing clear and sharp through the smoke.</p>
<p>The room went deathly still.</p>
<p>"No bells will toll in Dun Carrow without my order," Corvus said, his grey eyes leveling at the Inquisitor. "The tithe-barns will open at noon. Every family with a working hand receives three pounds of meal and a salt herring. The Church may pray over the barrels if it pleases you, Mother. But if a single novice bars the warehouse doors, I will have my border-lances split the timbers with axes."</p>
<p>Morwenna bowed her head, a venomous smile touching the corners of her lips. "The common folk will eat your meal today, my Lord. Let us see what they eat when the snows close the mountain passes in thirty days."</p>`,
    order: 2,
    wordCount: 362,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ch-3',
    worldId: 'world-ostergard',
    title: 'Chapter 3: The Ghost Fleet of Skell',
    content: `<p>Midnight found Corvus riding through the salt marshes of Mor with six trusted guardsmen, their horses' hooves muffled with oiled burlap. The mist lay thick over the peat pools, smelling of sulphur and decaying reed-beds.</p>
<p>At the mouth of the tidal estuary, where the black shingle met the grey surf, a single iron lantern glowed atop a driftwood spar. Beside it, drawn up on the gravel beach, lay a thirty-oared longship with high, curved dragon-stems.</p>
<p>A tall figure stepped out from the fog, cloaked in wolf-pelts and studded leather. A beard braided with silver wire framed a face mapped with salt-burns and old knife-wounds.</p>
<p>"You've grown thin in the stone cage, little brother," Torvald Black-Thorn said, his deep laughter rumbling over the surf.</p>
<p>"And you've grown bold, Torvald," Corvus said, dismounting into the freezing brine. "Two miles from my coastal battery? If my gunners had spotted your lantern, forty pounds of stone shot would have splintered your oars."</p>
<p>"Your gunners are half-frozen boys from the fens who can't see past their own breath," Torvald spat into the foam. He stepped forward until the two men stood face to face, the cold iron of their swords nearly touching. "I didn't come to burn your hulks, Corvus. I came to tell you who killed Julian."</p>
<p>Corvus's jaw tightened. "My scouts said it was your reavers."</p>
<p>"My reavers use axes and broad-heads," Torvald hissed, leaning in until Corvus could smell the sour ale and salt on his breath. "Julian was poisoned first with nightshade oil, then finished with a southland stiletto. The kind carried by the merchant envoys who sleep in your guest wings."</p>
<p>Torvald reached inside his pelt and pulled out a leather pouch, tossing it at Corvus's chest. It clinked heavily. Corvus unloosed the drawstring. Inside lay twelve gold coins, stamped not with the eagle of Ostergard, but with the crowned sun of the Southern Empire.</p>
<p>"They bought your brother's throat, Corvus," Torvald whispered. "And if you aren't careful, they will buy yours before the spring thaw."</p>`,
    order: 3,
    wordCount: 360,
    updatedAt: new Date().toISOString()
  }
]

export const sampleCanvases: WhiteboardCanvasData[] = [
  {
    id: 'canvas-conspiracy',
    worldId: 'world-ostergard',
    name: 'The Succession & Julian\'s Murder',
    nodes: [
      {
        id: 'node-card-corvus',
        type: 'canvasCard',
        position: { x: 300, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-corvus',
          title: 'Lord Corvus Ostergard',
          subtitle: 'The Iron Warden',
          avatar: 'https://cdna.artstation.com/p/assets/images/images/055/059/504/large/dmitry-ork-d4-portret-king-14102022.jpg?1666027507',
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-lysandra',
        type: 'canvasCard',
        position: { x: 620, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-lysandra',
          title: 'Lady Lysandra Vance',
          subtitle: 'High Chancellor',
          avatar: 'https://cdna.artstation.com/p/assets/images/images/058/323/244/large/eduardo-fernandez-baca-garcia-bstsuz-7ebe2bc3a992c1771b428e846.jpg?1673902936',
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-torvald',
        type: 'canvasCard',
        position: { x: 300, y: 520 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-torvald',
          title: 'Torvald Black-Thorn',
          subtitle: 'Corsair Admiral',
          avatar: 'https://cdna.artstation.com/p/assets/images/images/014/956/916/20190102165241/large/labros-panousis-viking-portrait.jpg',
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-julian',
        type: 'canvasCard',
        position: { x: 920, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-julian',
          title: 'Julian Ostergard',
          subtitle: 'The Drowned Heir (Dead)',
          avatar: 'https://cdna.artstation.com/p/assets/images/images/085/428/636/large/oleg-seleznev-kcd-portaits5.jpg',
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-note-clues',
        type: 'stickyNote',
        position: { x: 620, y: 520 },
        style: { width: 280, height: 220 },
        data: {
          title: 'Evidence: Nightshade & Southern Stilettos',
          content: '1. Torvald recovered southern imperial gold coins from Julian\'s killers.\n2. The harbor gates were unlocked from the INSIDE.\n3. Who in the Ducal Council benefits from famine and war?',
          width: 280,
          height: 220
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
    worldId: 'world-ostergard',
    name: 'The Ducal Court',
    parentId: null,
    isOpen: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-sovereigns',
    worldId: 'world-ostergard',
    name: 'House Ostergard',
    parentId: 'folder-court',
    isOpen: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-atlas',
    worldId: 'world-ostergard',
    name: 'Atlas & Cartography',
    parentId: null,
    isOpen: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-faith',
    worldId: 'world-ostergard',
    name: 'Faiths & Guilds',
    parentId: null,
    isOpen: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'folder-chronicles',
    worldId: 'world-ostergard',
    name: 'Manuscript Chapters',
    parentId: null,
    isOpen: true,
    createdAt: new Date().toISOString()
  }
]

export const sampleDirectoryItems: DirectoryItem[] = [
  // Ducal Court Items
  {
    id: 'item-corvus',
    worldId: 'world-ostergard',
    name: 'Lord Corvus Ostergard',
    type: 'card',
    targetId: 'char-corvus',
    folderId: 'folder-sovereigns',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-lysandra',
    worldId: 'world-ostergard',
    name: 'Lady Lysandra Vance',
    type: 'card',
    targetId: 'char-lysandra',
    folderId: 'folder-court',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-julian',
    worldId: 'world-ostergard',
    name: 'Julian Ostergard (Deceased)',
    type: 'card',
    targetId: 'char-julian',
    folderId: 'folder-sovereigns',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-vane',
    worldId: 'world-ostergard',
    name: 'Duke Vane Ostergard (Deceased)',
    type: 'card',
    targetId: 'char-vane',
    folderId: 'folder-sovereigns',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-sigil',
    worldId: 'world-ostergard',
    name: 'The Black-Iron Sigil',
    type: 'card',
    targetId: 'item-black-sigil',
    folderId: 'folder-sovereigns',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Faiths & Guilds
  {
    id: 'item-morwenna',
    worldId: 'world-ostergard',
    name: 'Arch-Inquisitor Morwenna',
    type: 'card',
    targetId: 'char-morwenna',
    folderId: 'folder-faith',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-ashen-liturgy',
    worldId: 'world-ostergard',
    name: 'The Ashen Liturgy',
    type: 'card',
    targetId: 'fac-ashen-liturgy',
    folderId: 'folder-faith',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-salt-covenant',
    worldId: 'world-ostergard',
    name: 'The Salt Covenant',
    type: 'card',
    targetId: 'fac-salt-covenant',
    folderId: 'folder-faith',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-torvald',
    worldId: 'world-ostergard',
    name: 'Torvald Black-Thorn',
    type: 'card',
    targetId: 'char-torvald',
    folderId: 'folder-court',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Atlas & Cartography
  {
    id: 'item-map',
    worldId: 'world-ostergard',
    name: 'The Bitter Coast & The Skell Archipelago',
    type: 'map',
    targetId: 'map-ostergard-coast',
    folderId: 'folder-atlas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-canvas',
    worldId: 'world-ostergard',
    name: 'The Succession & Julian\'s Murder',
    type: 'canvas',
    targetId: 'canvas-conspiracy',
    folderId: 'folder-atlas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-timeline',
    worldId: 'world-ostergard',
    name: 'Chronology of the Salt',
    type: 'timeline',
    targetId: 'timeline-main',
    folderId: 'folder-atlas',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Manuscript Chapters
  {
    id: 'item-ch1',
    worldId: 'world-ostergard',
    name: 'Chapter 1: The Salt on the Blade',
    type: 'writer',
    targetId: 'ch-1',
    folderId: 'folder-chronicles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-ch2',
    worldId: 'world-ostergard',
    name: 'Chapter 2: A Ledger of Cold Embers',
    type: 'writer',
    targetId: 'ch-2',
    folderId: 'folder-chronicles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'item-ch3',
    worldId: 'world-ostergard',
    name: 'Chapter 3: The Ghost Fleet of Skell',
    type: 'writer',
    targetId: 'ch-3',
    folderId: 'folder-chronicles',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleWorkspaceTabs: WorkspaceTab[] = [
  {
    id: 'tab-chapter-1',
    title: 'Chapter 1: The Salt on the Blade',
    type: 'writer',
    targetId: 'ch-1',
    isClosable: true
  },
  {
    id: 'tab-corvus',
    title: 'Lord Corvus Ostergard',
    type: 'wiki',
    targetId: 'char-corvus',
    isClosable: true
  },
  {
    id: 'tab-map',
    title: 'The Bitter Coast Map',
    type: 'map',
    targetId: 'map-ostergard-coast',
    isClosable: true
  },
  {
    id: 'tab-canvas',
    title: 'Conspiracy Canvas',
    type: 'canvas',
    targetId: 'canvas-conspiracy',
    isClosable: true
  }
]
