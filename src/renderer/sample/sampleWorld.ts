import { 
  World, LoreEntity, WorldMap, RelationEdge, TimelineEvent, ManuscriptChapter,
  DirectoryFolder, DirectoryItem, WhiteboardCanvasData, WorkspaceTab, WorldCalendarConfig,
  ConlangLanguage, ArtAttribution
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

export const OSTERGARD_MASTERPIECES = {
  world: {
    artist: 'Caspar David Friedrich',
    artworkTitle: 'Wanderer above the Sea of Fog',
    year: '1818',
    institution: 'Hamburger Kunsthalle',
    sourceUrl: 'https://online-sammlung.hamburger-kunsthalle.de/de/objekt/Der-Wanderer-ueber-dem-Nebelmeer',
    license: 'Open Access / CC0',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg/1200px-Caspar_David_Friedrich_-_Wanderer_above_the_sea_of_fog.jpg',
    medium: 'Oil on canvas',
    dimensions: '94.8 cm × 74.8 cm',
    notes: 'Iconic Romantic masterpiece depicting a wanderer overlooking a storm-scoured mist-filled sea.'
  },
  corvus: {
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'A Man in Armour',
    year: '1655',
    institution: 'Glasgow Museums (Kelvingrove)',
    sourceUrl: 'https://collections.glasgowlife.org.uk/item/60074',
    license: 'Public Domain / Open Access',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Rembrandt_van_Rijn_-_A_Man_in_Armour_-_1655.jpg/800px-Rembrandt_van_Rijn_-_A_Man_in_Armour_-_1655.jpg',
    medium: 'Oil on canvas',
    dimensions: '137.5 cm × 104.5 cm',
    notes: 'Warrior king in dark plate and helm, symbolizing scarred command and defensive vigilance.'
  },
  lysandra: {
    artist: 'John Singer Sargent',
    artworkTitle: 'Madame X (Madame Pierre Gautreau)',
    year: '1883–1884',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/12127',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/ap/original/DP-14436-001.jpg',
    medium: 'Oil on canvas',
    dimensions: '208.6 cm × 109.9 cm',
    notes: 'Sublime portrait of aristocratic poise and calculating subtlety in satin and gold.'
  },
  torvald: {
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'Bust of an Old Bearded Man',
    year: '1631',
    institution: 'Rijksmuseum, Amsterdam',
    sourceUrl: 'https://www.rijksmuseum.nl/en/collection/SK-A-4138',
    license: 'Public Domain / CC0',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/Rembrandt_van_Rijn_-_Bust_of_an_Old_Man_with_a_Beard_-_Google_Art_Project.jpg/800px-Rembrandt_van_Rijn_-_Bust_of_an_Old_Man_with_a_Beard_-_Google_Art_Project.jpg',
    medium: 'Oil on panel',
    dimensions: '59.9 cm × 51.1 cm',
    notes: 'Fierce, weathered profile evoking northern gales, salt spray, and corsair defiance.'
  },
  morwenna: {
    artist: 'Georges de La Tour',
    artworkTitle: 'The Penitent Magdalene',
    year: 'ca. 1640',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/436838',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/ep/original/DP276856.jpg',
    medium: 'Oil on canvas',
    dimensions: '133.4 cm × 102.2 cm',
    notes: 'Tenebrist candlelight contemplation of skull, flame, and mortal asceticism.'
  },
  vane: {
    artist: 'Rembrandt van Rijn',
    artworkTitle: 'Portrait of an Old Man',
    year: '1665',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/437394',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/ep/original/DP145924.jpg',
    medium: 'Oil on canvas',
    dimensions: '104 cm × 86 cm',
    notes: 'Somber portrait of aging sovereign authority, melancholy, and political suspicion.'
  },
  julian: {
    artist: 'John Singer Sargent',
    artworkTitle: 'Dr. Pozzi at Home',
    year: '1881',
    institution: 'Hammer Museum',
    sourceUrl: 'https://hammer.ucla.edu/collections/armand-hammer-collection/dr-pozzi-at-home',
    license: 'Public Domain / Open Access',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/John_Singer_Sargent_-_Dr._Pozzi_at_Home_-_Google_Art_Project.jpg/800px-John_Singer_Sargent_-_Dr._Pozzi_at_Home_-_Google_Art_Project.jpg',
    medium: 'Oil on canvas',
    dimensions: '201.6 cm × 102.2 cm',
    notes: 'Flamboyant crimson-robed gentleman of culture, charisma, and high court fashion.'
  },
  dunCarrow: {
    artist: 'Caspar David Friedrich',
    artworkTitle: 'The Abbey in the Oakwood',
    year: '1809–1810',
    institution: 'Alte Nationalgalerie, Berlin',
    sourceUrl: 'https://recherche.smb.museum/detail/964098',
    license: 'Public Domain / Open Access',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Caspar_David_Friedrich_-_Abtei_im_Eichwald_-_Google_Art_Project.jpg/1024px-Caspar_David_Friedrich_-_Abtei_im_Eichwald_-_Google_Art_Project.jpg',
    medium: 'Oil on canvas',
    dimensions: '110 cm × 171 cm',
    notes: 'Haunting gothic ruins rising above winter trees, mist, and ancient stone ramparts.'
  },
  morMarshes: {
    artist: 'Caspar David Friedrich',
    artworkTitle: 'The Sea of Ice (The Wreck of Hope)',
    year: '1823–1824',
    institution: 'Hamburger Kunsthalle',
    sourceUrl: 'https://online-sammlung.hamburger-kunsthalle.de/de/objekt/Das-Eismeer',
    license: 'Open Access / CC0',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Caspar_David_Friedrich_-_Das_Eismeer_-_Hamburger_Kunsthalle.jpg/1024px-Caspar_David_Friedrich_-_Das_Eismeer_-_Hamburger_Kunsthalle.jpg',
    medium: 'Oil on canvas',
    dimensions: '96.7 cm × 126.9 cm',
    notes: 'Jagged slabs of frozen brine and desolate winter wreckage in primeval fens.'
  },
  skellIsles: {
    artist: 'Caspar David Friedrich',
    artworkTitle: 'Moonrise by the Sea',
    year: '1822',
    institution: 'Alte Nationalgalerie, Berlin',
    sourceUrl: 'https://recherche.smb.museum/detail/964101',
    license: 'Public Domain / Open Access',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Caspar_David_Friedrich_-_Mondaufgang_am_Meer_-_Google_Art_Project.jpg/1024px-Caspar_David_Friedrich_-_Mondaufgang_am_Meer_-_Google_Art_Project.jpg',
    medium: 'Oil on canvas',
    dimensions: '55 cm × 71 cm',
    notes: 'Boulders on a rocky northern shore bathed in silver moonlight, gazing at distant sails.'
  },
  houseOstergard: {
    artist: 'Albrecht Dürer',
    artworkTitle: 'Coat of Arms with a Skull',
    year: '1503',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/391256',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/dp/original/DP816117.jpg',
    medium: 'Engraving',
    dimensions: '22 cm × 15.6 cm',
    notes: 'Heraldic dynastic emblem bearing winged helm, armorial shield, and memento mori.'
  },
  saltCovenant: {
    artist: 'Rembrandt van Rijn',
    artworkTitle: "The Syndics of the Drapers' Guild",
    year: '1662',
    institution: 'Rijksmuseum, Amsterdam',
    sourceUrl: 'https://www.rijksmuseum.nl/en/collection/SK-C-6',
    license: 'Public Domain / CC0',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Rembrandt_-_The_Syndics_of_the_Amsterdam_Drapers%27_Guild%2C_known_as_%27The_Staalmeesters%27_-_Google_Art_Project.jpg/1024px-Rembrandt_-_The_Syndics_of_the_Amsterdam_Drapers%27_Guild%2C_known_as_%27The_Staalmeesters%27_-_Google_Art_Project.jpg',
    medium: 'Oil on canvas',
    dimensions: '191.5 cm × 279 cm',
    notes: 'The merchant conclave reviewing maritime ledgers and grain shipping manifests.'
  },
  ashenLiturgy: {
    artist: 'Gustave Doré',
    artworkTitle: "Dante's Inferno: The Heretics",
    year: '1861',
    institution: 'The Cleveland Museum of Art',
    sourceUrl: 'https://www.clevelandart.org/art/1922.378',
    license: 'CC0 1.0 Universal',
    thumbnailUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Gustave_Dor%C3%A9_-_Dante_Alighieri_-_Inferno_-_Plate_28_%28Canto_IX_-_The_Heretics%29.jpg/800px-Gustave_Dor%C3%A9_-_Dante_Alighieri_-_Inferno_-_Plate_28_%28Canto_IX_-_The_Heretics%29.jpg',
    medium: 'Wood engraving',
    dimensions: '24.2 cm × 19.8 cm',
    notes: 'Fiery sepulchers and ascetic inquisitors purging corruption in sacred fire.'
  },
  blackSigil: {
    artist: 'Renaissance Goldsmith Art',
    artworkTitle: 'Signet Ring with Intaglio Crest',
    year: 'ca. 1570',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/460773',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/md/original/sf1975-1-1407s1.jpg',
    medium: 'Gold and intaglio engraved stone',
    dimensions: '2.5 cm × 2.2 cm',
    notes: 'Imperial signet ring of heavy star-iron and blood-wax seal intaglio.'
  },
  widowsWeight: {
    artist: 'Albrecht Dürer',
    artworkTitle: 'Knight, Death and the Devil',
    year: '1513',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/391255',
    license: 'Open Access (CC0)',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/dp/original/DP816115.jpg',
    medium: 'Engraving',
    dimensions: '24.6 cm × 19 cm',
    notes: 'Armored knight on warhorse with notched broadsword riding through the valley of shadow.'
  },
  mapCoast: {
    artist: 'Lucas Janszoon Waghenaer',
    artworkTitle: "Spieghel der Zeevaerdt (The Mariner's Mirror: Sea Chart)",
    year: '1584–1585',
    institution: 'The Metropolitan Museum of Art',
    sourceUrl: 'https://www.metmuseum.org/art/collection/search/391255',
    license: 'Public Domain / CC0',
    thumbnailUrl: 'https://images.metmuseum.org/CRDImages/dp/original/DP802619.jpg',
    medium: 'Hand-colored copperplate engraving',
    dimensions: '33 cm × 51 cm',
    notes: 'Detailed navigational chart of coastal rocks, sea beacons, sounding depths, and skerries.'
  }
} as const satisfies Record<string, ArtAttribution>;

export const sampleWorld: World = {
  id: 'world-ostergard',
  name: 'The Ashen Crown: Chronicles of Ostergard',
  tagline: 'A storm-scoured realm of basalt cliffs and salt marshes, bled dry by famine and a dying duke\'s secret.',
  description: 'For three centuries, House Ostergard held the Bitter Coast through iron discipline, herring fleets, and the ancient Salt Covenant. But the Winter of the Drowned Grain has turned the wheat black in the silos, the exiled fleet of Torvald Black-Thorn strikes at coastal supply lines, and with the sudden poisoning of the Old Duke, the basalt throne falls to Corvus the Iron Warden—a scarred frontier soldier surrounded by ambitious merchant oligarchs, fanatic inquisitors, and starving commoners.',
  genre: 'Grimdark',
  calendarConfig: OSTERGARD_CALENDAR_CONFIG,
  bannerUrl: OSTERGARD_MASTERPIECES.world.thumbnailUrl,
  thumbnailUrl: OSTERGARD_MASTERPIECES.world.thumbnailUrl,
  attribution: OSTERGARD_MASTERPIECES.world,
  artAttribution: OSTERGARD_MASTERPIECES.world,
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
    avatar: OSTERGARD_MASTERPIECES.corvus.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.corvus.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.corvus,
    artAttribution: OSTERGARD_MASTERPIECES.corvus,
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
    avatar: OSTERGARD_MASTERPIECES.lysandra.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.lysandra.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.lysandra,
    artAttribution: OSTERGARD_MASTERPIECES.lysandra,
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
    avatar: OSTERGARD_MASTERPIECES.torvald.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.torvald.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.torvald,
    artAttribution: OSTERGARD_MASTERPIECES.torvald,
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
    avatar: OSTERGARD_MASTERPIECES.morwenna.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.morwenna.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.morwenna,
    artAttribution: OSTERGARD_MASTERPIECES.morwenna,
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
    content: `<p>A paranoid and calculating autocrat, <strong>Duke Vane</strong> centralized taxation, crushed peasant uprisings, and amassed a private hoard of silver bullion while the frontier fell into disrepair. His death during the harvest banquet remains an open murder investigation in the council chamber.</p><blockquote>"Let the border-posts freeze. So long as the silver arrives in Dun Carrow, the Duchy endures." — Vane the Miser</blockquote>`,
    tags: ['Royalty', 'Deceased', 'House Ostergard'],
    aliases: ['The Old Duke', 'Vane the Miser'],
    avatar: OSTERGARD_MASTERPIECES.vane.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.vane.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.vane,
    artAttribution: OSTERGARD_MASTERPIECES.vane,
    infobox: {
      subtitle: 'Late Sovereign Duke (Deceased)',
      sections: [
        {
          title: 'Dynastic Records',
          fields: [
            { id: 'v1', label: 'Reign', value: '991 – 1021 of the Salt', type: 'text' },
            { id: 'v2', label: 'House', value: 'House Ostergard', type: 'entity-link', targetEntityId: 'fac-house-ostergard' },
            { id: 'v3', label: 'Heir', value: 'Julian Ostergard (Murdered)', type: 'entity-link', targetEntityId: 'char-julian' },
            { id: 'v4', label: 'Successor', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'char-julian',
    worldId: 'world-ostergard',
    title: 'Julian Ostergard',
    type: 'character',
    summary: 'The refined elder son of Duke Vane, murdered on the eve of his coronation.',
    content: `<p>Charming, cultured, and beloved by the capital's merchant guilds, <strong>Julian</strong> was poised to usher in an era of reconciliation with the southern realms. His throat was slashed in an alleyway outside the counting-houses three nights before his father's death, plunging the realm into succession chaos.</p><blockquote>"Julian believed treaties were written with ink. He forgot that along the Bitter Coast, ink washes away in the first rain." — Lord Corvus</blockquote>`,
    tags: ['Nobility', 'Deceased', 'Heir'],
    aliases: ['The Drowned Heir', 'Julian the Fair'],
    avatar: OSTERGARD_MASTERPIECES.julian.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.julian.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.julian,
    artAttribution: OSTERGARD_MASTERPIECES.julian,
    infobox: {
      subtitle: 'Crown Heir (Murdered)',
      sections: [
        {
          title: 'Court Dossier',
          fields: [
            { id: 'j1', label: 'Status', value: 'Slain Prior to Coronation', type: 'text' },
            { id: 'j2', label: 'House', value: 'House Ostergard', type: 'entity-link', targetEntityId: 'fac-house-ostergard' },
            { id: 'j3', label: 'Brother', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' },
            { id: 'j4', label: 'Murder Site', value: 'The Salt Marshes of Mor', type: 'entity-link', targetEntityId: 'loc-mor-marshes' }
          ]
        }
      ]
    },
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
    avatar: OSTERGARD_MASTERPIECES.dunCarrow.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.dunCarrow.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.dunCarrow,
    artAttribution: OSTERGARD_MASTERPIECES.dunCarrow,
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
    avatar: OSTERGARD_MASTERPIECES.morMarshes.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.morMarshes.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.morMarshes,
    artAttribution: OSTERGARD_MASTERPIECES.morMarshes,
    infobox: {
      subtitle: 'Brackish Wetland Territory',
      sections: [
        {
          title: 'Geography & Crime',
          fields: [
            { id: 'mm1', label: 'Terrain', value: 'Acidic Peat & Salt Pools', type: 'text' },
            { id: 'mm2', label: 'Factions Active', value: 'Salt Smugglers & Skell Scouts', type: 'text' },
            { id: 'mm3', label: 'Notorious Site', value: 'Julian\'s Murder Reeds', type: 'entity-link', targetEntityId: 'char-julian' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'loc-skell-isles',
    worldId: 'world-ostergard',
    title: 'The Skell Archipelago',
    type: 'location',
    summary: 'A jagged chain of granite islets that serve as the stronghold of Torvald\'s corsair fleet.',
    content: `<p>Surrounded by ship-killing reefs and perpetual sea-fog, the <strong>Skell Isles</strong> are inaccessible to deep-draft galleys. Torvald's raiders operate slipways and smokehouses along the sheltered inlets of Skell Haven, trading looted grain for southern weapons.</p><blockquote>"The waves here break men before they touch the rocks. Do not seek Torvald unless your bilge is empty and your heart is colder than the sea." — Maritime Log</blockquote>`,
    tags: ['Archipelago', 'Pirate Haven', 'Island'],
    aliases: ['The Wolf Skerries'],
    avatar: OSTERGARD_MASTERPIECES.skellIsles.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.skellIsles.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.skellIsles,
    artAttribution: OSTERGARD_MASTERPIECES.skellIsles,
    infobox: {
      subtitle: 'Independent Corsair Stronghold',
      sections: [
        {
          title: 'Haven Details',
          fields: [
            { id: 'si1', label: 'Command', value: 'Torvald Black-Thorn', type: 'entity-link', targetEntityId: 'char-torvald' },
            { id: 'si2', label: 'Naval Strength', value: '42 Longships', type: 'text' },
            { id: 'si3', label: 'Geography', value: 'Basalt Sea Stacks (Drang)', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-house-ostergard',
    worldId: 'world-ostergard',
    title: 'House Ostergard',
    type: 'faction',
    summary: 'The ancient ducal dynasty ruling the Bitter Coast since the Great Inundation.',
    content: `<p>Bearing the heraldry of a black sea-eagle clenching an anchor, <strong>House Ostergard</strong> made its fortune through salt mines, timber exports, and coastal warfare. Centuries of inbreeding and frontier conflict have reduced the legitimate lineage down to Lord Corvus.</p><blockquote>"Through Iron, Salt, and Stone." — Motto of House Ostergard</blockquote>`,
    tags: ['Dynasty', 'Noble House', 'Sovereigns'],
    aliases: ['The Sea-Eagle Lords'],
    avatar: OSTERGARD_MASTERPIECES.houseOstergard.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.houseOstergard.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.houseOstergard,
    artAttribution: OSTERGARD_MASTERPIECES.houseOstergard,
    infobox: {
      subtitle: 'Ducal Sovereign Dynasty',
      sections: [
        {
          title: 'Lineage Overview',
          fields: [
            { id: 'ho1', label: 'Current Sovereign', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' },
            { id: 'ho2', label: 'Ancestral Seat', value: 'The Citadel of Dun Carrow', type: 'entity-link', targetEntityId: 'loc-dun-carrow' },
            { id: 'ho3', label: 'Heraldic Sigil', value: 'The Black-Iron Sigil', type: 'entity-link', targetEntityId: 'item-black-sigil' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-salt-covenant',
    worldId: 'world-ostergard',
    title: 'The Salt Covenant',
    type: 'faction',
    summary: 'The oligarchic guild syndicate controlling coastal fisheries, salt pans, and sea trade.',
    content: `<p>A confederation of seven merchant families that hold the Ducal Treasury in suffocating debt. Through their control of the brine-pits, the <strong>Covenant</strong> dictates the price of preserved winter food. They privately back Lady Lysandra, believing she will protect their commercial privileges against military seizure.</p><blockquote>"Kings march on steel; kingdoms breathe on salt." — Covenant Guild Charter</blockquote>`,
    tags: ['Guild', 'Commerce', 'Oligarchy'],
    aliases: ['The Brine Masters', 'The Merchant Conclave'],
    avatar: OSTERGARD_MASTERPIECES.saltCovenant.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.saltCovenant.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.saltCovenant,
    artAttribution: OSTERGARD_MASTERPIECES.saltCovenant,
    infobox: {
      subtitle: 'Mercantile Syndicate',
      sections: [
        {
          title: 'Syndicate Profile',
          fields: [
            { id: 'sc1', label: 'Exchequer Envoy', value: 'Lady Lysandra Vance', type: 'entity-link', targetEntityId: 'char-lysandra' },
            { id: 'sc2', label: 'Monopoly', value: 'Salt Brine & Maritime Grain Shipping', type: 'text' },
            { id: 'sc3', label: 'Seat', value: 'The Seven Counting-Houses', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'fac-ashen-liturgy',
    worldId: 'world-ostergard',
    title: 'The Ashen Liturgy',
    type: 'faction',
    summary: 'The ascetic state religion venerating the Sacred Hearth and practicing corpse-salting.',
    content: `<p>The dominant faith across Ostergard. The <strong>Liturgy</strong> teaches that moisture breeds rot and spiritual decay; the dead must be salted and dried in cliffside bone-houses so their spirits can join the eternal hearth fire. Under Arch-Inquisitor Morwenna, the faith has grown increasingly militant.</p><blockquote>"Burn the flesh, salt the bone, kindle the ash." — Third Canticle of the Cinder</blockquote>`,
    tags: ['Religion', 'Inquisition', 'Church'],
    aliases: ['The Order of the Hearth'],
    avatar: OSTERGARD_MASTERPIECES.ashenLiturgy.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.ashenLiturgy.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.ashenLiturgy,
    artAttribution: OSTERGARD_MASTERPIECES.ashenLiturgy,
    infobox: {
      subtitle: 'Orthodox Religious Body',
      sections: [
        {
          title: 'Ecclesiastical Hierarchy',
          fields: [
            { id: 'al1', label: 'High Suprema', value: 'Arch-Inquisitor Morwenna', type: 'entity-link', targetEntityId: 'char-morwenna' },
            { id: 'al2', label: 'Doctrine', value: 'Purification through Salt & Corpse Kilns', type: 'text' },
            { id: 'al3', label: 'Militia', value: 'Sisters of the Cinder', type: 'text' }
          ]
        }
      ]
    },
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
    avatar: OSTERGARD_MASTERPIECES.blackSigil.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.blackSigil.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.blackSigil,
    artAttribution: OSTERGARD_MASTERPIECES.blackSigil,
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
    content: `<p>A heavy, utilitarian bastard sword lacking gold filigree or gem inlay. Its blade carries seven distinct notches from the Siege of Dun Craigh. It is balanced for shattering shield-rims and heavy winter mail rather than courtly dueling.</p><blockquote>"A sword is not a jewel for the court. It is a tool for slaughtering beasts." — Corvus</blockquote>`,
    tags: ['Weapon', 'Broadsword'],
    aliases: ['The Bog Blade'],
    avatar: OSTERGARD_MASTERPIECES.widowsWeight.thumbnailUrl,
    avatarUrl: OSTERGARD_MASTERPIECES.widowsWeight.thumbnailUrl,
    attribution: OSTERGARD_MASTERPIECES.widowsWeight,
    artAttribution: OSTERGARD_MASTERPIECES.widowsWeight,
    infobox: {
      subtitle: 'Martial Broadsword',
      sections: [
        {
          title: 'Weapon Specifications',
          fields: [
            { id: 'ww1', label: 'Wielder', value: 'Lord Corvus Ostergard', type: 'entity-link', targetEntityId: 'char-corvus' },
            { id: 'ww2', label: 'Forge Material', value: 'Bog-iron quenched in cold brine', type: 'text' },
            { id: 'ww3', label: 'Notches', value: 'Seven battle tallies', type: 'text' }
          ]
        }
      ]
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export const sampleMap: WorldMap = {
  id: 'map-ostergard-coast',
  worldId: 'world-ostergard',
  name: 'The Bitter Coast & The Skell Archipelago',
  description: 'Detailed maritime chart of the Grand Duchy of Ostergard, showing sea-lanes, coastal beacons, and pirate waters.',
  imageUrl: OSTERGARD_MASTERPIECES.mapCoast.thumbnailUrl,
  attribution: OSTERGARD_MASTERPIECES.mapCoast,
  artAttribution: OSTERGARD_MASTERPIECES.mapCoast,
  scaleUnit: 'Leagues',
  scaleDistance: 50,
  scaleBarPixels: 140,
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
  },
  {
    id: 'rel-corvus-widowsweight',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-corvus',
    targetEntityId: 'item-widows-weight',
    relationType: 'creator',
    label: 'Bog Blade',
    icon: 'swords',
    color: '#94a3b8',
    isDashed: false,
    notes: 'Quenched in salt brine with seven frontier battle notches'
  },
  {
    id: 'rel-torvald-skell',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-torvald',
    targetEntityId: 'loc-skell-isles',
    relationType: 'ruler',
    label: 'Reaver Haven',
    icon: 'anchor',
    color: '#06b6d4',
    isDashed: false,
    notes: 'Stronghold in the granite skerries'
  },
  {
    id: 'rel-vane-house',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-vane',
    targetEntityId: 'fac-house-ostergard',
    relationType: 'ruler',
    label: 'Late Patriarch',
    icon: 'crown',
    color: '#64748b',
    isDashed: false,
    notes: 'Thirty winters of autocratic rule'
  },
  {
    id: 'rel-julian-marshes',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-julian',
    targetEntityId: 'loc-mor-marshes',
    relationType: 'custom',
    label: 'Murder Reeds',
    icon: 'skull',
    color: '#f43f5e',
    isDashed: true,
    notes: 'Body recovered from the tidal salt fens'
  },
  {
    id: 'rel-lysandra-morwenna',
    worldId: 'world-ostergard',
    sourceEntityId: 'char-lysandra',
    targetEntityId: 'char-morwenna',
    relationType: 'rival',
    label: 'Council Feud',
    icon: 'flame',
    color: '#a855f7',
    isDashed: true,
    notes: 'Clash between monastic hoarding and exchequer food distribution'
  }
]

export const sampleRelationNodePositions: Record<string, { x: number; y: number }> = {
  'char-corvus': { x: 480, y: 160 },
  'char-vane': { x: 480, y: -80 },
  'char-julian': { x: 780, y: 160 },
  'char-lysandra': { x: 180, y: 160 },
  'char-torvald': { x: 180, y: 440 },
  'char-morwenna': { x: 780, y: 440 },
  'loc-dun-carrow': { x: 480, y: 440 },
  'fac-house-ostergard': { x: 780, y: -80 },
  'fac-salt-covenant': { x: -100, y: 160 },
  'fac-ashen-liturgy': { x: 1060, y: 440 },
  'item-black-sigil': { x: 480, y: 700 },
  'item-widows-weight': { x: 220, y: 700 },
  'loc-skell-isles': { x: -100, y: 440 },
  'loc-mor-marshes': { x: -100, y: 700 }
}

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
    content: `<p>The sea wind off the Bitter Strait tasted of rust and drowned kelp. It screamed through the embrasures of the High Battery with a sound like dying horses, flinging needles of cold salt-spray against the black basalt ramparts of [[The Citadel of Dun Carrow]].</p>
<p>[[Lord Corvus Ostergard]] did not flinch. He leaned his scarred knuckles against the crenellation, watching the grey swell break against the jagged teeth of the Lower Skerries eighty fathoms below. In his nineteen winters along the Northern Wall, he had learned that the cold was not an enemy to be fought, but an auditor that uncovered every flaw in a man's mail and marrow.</p>
<p>"Two more grain-hulks from the Southern Barony ran aground off the Weeping Spit before daybreak, my Lord," a voice said through the wind.</p>
<p>Corvus turned his head slowly. [[Lady Lysandra Vance]] stood wrapped in dark lambskin, her silver hair pinned with bone needles against the gale. Under her arm, she clutched the oiled-leather binder that held the daily tally of the realm's slow starvation.</p>
<p>"Were they scuttled?" Corvus asked, his voice harsh from years of shouting over blizzard gales.</p>
<p>"Their rudders were unhung," Lysandra replied smoothly. "Cut clean through with iron saws while they swung at anchor in the roadstead. [[Torvald Black-Thorn]]'s scouts left his branding-chisel hammered into the bowsprit of the lead galley."</p>
<p>Corvus touched the thumb of his left hand. [[The Black-Iron Sigil]] was cold against his calloused skin. "Torvald doesn't burn grain. He eats it."</p>
<p>"He didn't burn it, Corvus. He lightered the flour sacks onto three Skell longships before he broached the hulls. Your brother [[Julian Ostergard]]'s death bought him the harbor manifests. He knows our granaries have less than six weeks of dry rye remaining before the commons begin boiling harness leather."</p>
<p>Corvus looked past her, toward the lower bailey where the elite <span class="oros-conlang-term">Salthird</span> marine guard held the watergate while three hundred starving dockmen gathered outside the tithe-gates, their breath rising like smoke into the freezing dawn. By the ancient <span class="oros-conlang-term">Khorash</span> oath of his house, he was bound to protect them, backed by nine sworn <span class="oros-conlang-term">Skjaldmær</span> shield-maidens.</p>
<p>"Then we do not wait for the next convoy," Corvus said, resting his hand on the pommel of [[Widow's Weight]]. "Have the harbor chains dropped. Sound the muster at the tide-gate."</p>`,
    order: 1,
    wordCount: 395,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ch-2',
    worldId: 'world-ostergard',
    title: 'Chapter 2: A Ledger of Cold Embers',
    content: `<p>The council chamber smelled of wet wool, burning peat, and tallow. At the head of the oak table, where [[Duke Vane Ostergard]] had sat for thirty winters passing death warrants in his thin, spidery hand, [[Lord Corvus Ostergard]] sat with his broadsword [[Widow's Weight]] laid unbelted before him.</p>
<p>"It is divine castigation," [[Arch-Inquisitor Morwenna]] pronounced. She stood by the narrow slit window, her grey cowl casting deep hollows over her cheekbones. Her fingers clicked restlessly along a rosary of charred bone. "The black fungus on the grain stalks is not a sickness of the soil, Lord Warden. It is the rot of heresy. Your father permitted southern pagans to erect their shrine-stones on the headland in exchange for gold ducats. The Sacred Hearth has withdrawn its warmth during this unforgiving <span class="oros-conlang-term">Mørk-Tid</span> freeze."</p>
<p>"The Sacred Hearth does not fill a belly, Mother," [[Lady Lysandra Vance]] countered from across the table, dipping her quill into black oak-gall ink. "And your monastic tithe-barns in the High Quarter currently hold four hundred tierces of salt-beef that haven't seen the light of day since autumn. [[The Salt Covenant]] cannot keep the fisheries operating if the fishermen are fainting at the oars."</p>
<p>Morwenna's gaze snapped to the Chancellor, pale eyes burning like coals in the hearth. "That beef is consecrated for the holy funeral kilns. Touch it, Lady Vance, and I will have the bells of [[The Ashen Liturgy]] toll a curse across your counting-houses before sundown. We will not pay a <span class="oros-conlang-term">Valen-Geld</span> tribute to appease your merchant guilds."</p>
<p>Corvus's fist struck the table. The iron blade of [[Widow's Weight]] jumped an inch off the oak planks, ringing clear and sharp through the peat smoke of the Cinder-Hearth.</p>
<p>The room went deathly still.</p>
<p>"No bells will toll in [[The Citadel of Dun Carrow]] without my order," Corvus said, his grey eyes leveling at the Inquisitor. "The tithe-barns will open at noon. Every family with a working hand receives three pounds of meal and a salt herring. The Church may pray over the barrels if it pleases you, Mother. But if a single novice bars the warehouse doors, I will have my border-lances split the timbers with axes."</p>
<p>Morwenna bowed her head, a venomous smile touching the corners of her lips. "The common folk will eat your meal today, my Lord. Let us see what they eat when the snows close the mountain passes in thirty days."</p>`,
    order: 2,
    wordCount: 405,
    updatedAt: new Date().toISOString()
  },
  {
    id: 'ch-3',
    worldId: 'world-ostergard',
    title: 'Chapter 3: The Ghost Fleet of Skell',
    content: `<p>Midnight found Corvus riding through [[The Salt Marshes of Mor]] with six trusted guardsmen, their horses' hooves muffled with oiled burlap. The mist lay thick over the peat pools, smelling of sulphur and decaying reed-beds.</p>
<p>At the mouth of the tidal estuary, where the black shingle met the grey surf, a single iron lantern glowed atop a driftwood spar. Beside it, drawn up on the gravel beach, lay a thirty-oared longship with high, curved dragon-stems hailing from [[The Skell Archipelago]].</p>
<p>A tall figure stepped out from the fog, cloaked in wolf-pelts and studded leather. A beard braided with silver wire framed a face mapped with salt-burns and old knife-wounds, his fearsome <span class="oros-conlang-term">Draugr-Helm</span> visor thrown back.</p>
<p>"You've grown thin in the stone cage, little brother," [[Torvald Black-Thorn]] said, his deep laughter rumbling over the surf.</p>
<p>"And you've grown bold, Torvald," Corvus said, dismounting into the freezing brine. "Two miles from my coastal battery at [[The Citadel of Dun Carrow]]? If my gunners had spotted your lantern through the basalt <span class="oros-conlang-term">Drang</span> corridors, forty pounds of stone shot would have splintered your oars."</p>
<p>"Your gunners are half-frozen boys from the fens who can't see past their own breath, chasing after peasant <span class="oros-conlang-term">Skiff-Bait</span> decoys," Torvald spat into the foam. He stepped forward until the two men stood face to face, the cold iron of their swords nearly touching. "I didn't come to burn your hulks, Corvus. I came to tell you who killed [[Julian Ostergard]]."</p>
<p>Corvus's jaw tightened. "My scouts said it was your reavers."</p>
<p>"My reavers use axes and broad-heads," Torvald hissed, leaning in until Corvus could smell the sour ale and salt on his breath. "Julian was poisoned first with nightshade oil, then finished with a southland stiletto. The kind carried by the merchant envoys of [[The Salt Covenant]] who sleep in your guest wings."</p>
<p>Torvald reached inside his pelt and pulled out a leather pouch, tossing it at Corvus's chest. It clinked heavily. Corvus unloosed the drawstring. Inside lay twelve gold coins, stamped not with the eagle of [[House Ostergard]], but with the crowned sun of the Southern Empire.</p>
<p>"They bought your brother's throat, Corvus," Torvald whispered. "And if you aren't careful, they will buy yours before the spring thaw."</p>`,
    order: 3,
    wordCount: 400,
    updatedAt: new Date().toISOString()
  }
]

export const sampleCanvases: WhiteboardCanvasData[] = [
  {
    id: 'canvas-conspiracy',
    worldId: 'world-ostergard',
    name: 'The Succession & Julian\'s Murder',
    nodes: [
      // Cluster 1: The Succession Crisis (Center/Top)
      {
        id: 'node-card-corvus',
        type: 'canvasCard',
        position: { x: 560, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-corvus',
          title: 'Lord Corvus Ostergard',
          subtitle: 'The Iron Warden',
          avatar: OSTERGARD_MASTERPIECES.corvus.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.corvus,
          artAttribution: OSTERGARD_MASTERPIECES.corvus,
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
          avatar: OSTERGARD_MASTERPIECES.julian.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.julian,
          artAttribution: OSTERGARD_MASTERPIECES.julian,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-note-autopsy',
        type: 'stickyNote',
        position: { x: 920, y: 460 },
        style: { width: 260, height: 200 },
        data: {
          title: 'Autopsy: Southern Nightshade',
          content: '• No sea brine in the lungs — Julian was strangled before being rolled into the harbor reeds.\n• Throat wound from a 4-inch southland stiletto.\n• Stolen: Master Key to the Harbor Sluice-Gates.',
          color: 'amber',
          width: 260,
          height: 200
        }
      },
      {
        id: 'node-doc-decree',
        type: 'canvasText',
        position: { x: 560, y: 460 },
        style: { width: 280, height: 160 },
        data: {
          title: 'Ducal Emergency Decree',
          content: 'By command of Lord Corvus, 11th Duke: Dun Carrow is sealed under martial curfew. The tide-gates shall remain locked until Julian\'s murderers hang from the lower yardarms.',
          width: 280,
          height: 160
        }
      },
      {
        id: 'node-seal-directive',
        type: 'stickyNote',
        position: { x: 740, y: 320 },
        style: { width: 220, height: 160 },
        data: {
          title: 'Blood-Wax Directive',
          content: 'CORVUS\'S SEAL: Search every merchant galley departing for the Southern Empire. Impound all silver coin.',
          color: 'rose',
          width: 220,
          height: 160
        }
      },

      // Cluster 2: Wharf Guild Ledger Espionage (Left)
      {
        id: 'node-card-lysandra',
        type: 'canvasCard',
        position: { x: 160, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-lysandra',
          title: 'Lady Lysandra Vance',
          subtitle: 'High Chancellor',
          avatar: OSTERGARD_MASTERPIECES.lysandra.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.lysandra,
          artAttribution: OSTERGARD_MASTERPIECES.lysandra,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-covenant',
        type: 'canvasCard',
        position: { x: -140, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'fac-salt-covenant',
          title: 'The Salt Covenant',
          subtitle: 'Merchant Syndicate',
          avatar: OSTERGARD_MASTERPIECES.saltCovenant.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.saltCovenant,
          artAttribution: OSTERGARD_MASTERPIECES.saltCovenant,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-note-manifest',
        type: 'stickyNote',
        position: { x: 160, y: 460 },
        style: { width: 260, height: 200 },
        data: {
          title: 'Weeping Bastion Granaries',
          content: '• 12,000 bushels of dry winter rye hidden in the abandoned salt galleries.\n• Lysandra\'s double ledgers show half-rations to the fleet, while guild oligarchs hoard flour sacks.\n• If the commons learn of this reserve, Dun Carrow burns.',
          color: 'slate',
          width: 260,
          height: 200
        }
      },
      {
        id: 'node-quote-lysandra',
        type: 'canvasText',
        position: { x: -140, y: 460 },
        style: { width: 260, height: 160 },
        data: {
          title: 'Chancellor\'s Axiom',
          content: '"A fortress withstands catapult shot, but starving guards will sell the gate keys for a crust of moldy bread."',
          width: 260,
          height: 160
        }
      },

      // Cluster 3: The Inquisitorial Decrees (Right)
      {
        id: 'node-card-morwenna',
        type: 'canvasCard',
        position: { x: 1320, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-morwenna',
          title: 'Arch-Inquisitor Morwenna',
          subtitle: 'Suprema of the Liturgy',
          avatar: OSTERGARD_MASTERPIECES.morwenna.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.morwenna,
          artAttribution: OSTERGARD_MASTERPIECES.morwenna,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-liturgy',
        type: 'canvasCard',
        position: { x: 1640, y: 160 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'fac-ashen-liturgy',
          title: 'The Ashen Liturgy',
          subtitle: 'Church of Cinder',
          avatar: OSTERGARD_MASTERPIECES.ashenLiturgy.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.ashenLiturgy,
          artAttribution: OSTERGARD_MASTERPIECES.ashenLiturgy,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-note-inquisition',
        type: 'stickyNote',
        position: { x: 1320, y: 460 },
        style: { width: 260, height: 200 },
        data: {
          title: 'Decree: The Holy Salt-Kilns',
          content: '• The grain blight is proclaimed divine punishment for southern commerce.\n• 400 tierces of consecrated beef locked inside the cathedral crypts.\n• Morwenna threatens excommunication if garrison lances touch church stores.',
          color: 'violet',
          width: 260,
          height: 200
        }
      },
      {
        id: 'node-note-rosary',
        type: 'stickyNote',
        position: { x: 1640, y: 460 },
        style: { width: 220, height: 160 },
        data: {
          title: 'Evidence: Bone Rosary',
          content: 'Found near the marsh sluice: carved human vertebrae beads smelling of funeral incense and sulphur.',
          color: 'rose',
          width: 220,
          height: 160
        }
      },

      // Cluster 4: Corsair Coastal Routes (Bottom)
      {
        id: 'node-card-torvald',
        type: 'canvasCard',
        position: { x: 160, y: 780 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'char-torvald',
          title: 'Torvald Black-Thorn',
          subtitle: 'Corsair Admiral',
          avatar: OSTERGARD_MASTERPIECES.torvald.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.torvald,
          artAttribution: OSTERGARD_MASTERPIECES.torvald,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-card-skellisles',
        type: 'canvasCard',
        position: { x: -140, y: 780 },
        style: { width: 190, height: 260 },
        data: {
          entityId: 'loc-skell-isles',
          title: 'The Skell Archipelago',
          subtitle: 'Pirate Skerries',
          avatar: OSTERGARD_MASTERPIECES.skellIsles.thumbnailUrl,
          attribution: OSTERGARD_MASTERPIECES.skellIsles,
          artAttribution: OSTERGARD_MASTERPIECES.skellIsles,
          width: 190,
          height: 260
        }
      },
      {
        id: 'node-note-goldcoins',
        type: 'stickyNote',
        position: { x: 560, y: 780 },
        style: { width: 260, height: 200 },
        data: {
          title: 'The Southern Bribe Pouch',
          content: '• 12 gold pieces stamped with the Southern Imperial Sun, delivered by Torvald.\n• Paid to corsair skiffs to divert grain convoys and leave Dun Carrow to starve.\n• Who in the capital negotiated with the Southern Empire?',
          color: 'amber',
          width: 260,
          height: 200
        }
      },
      {
        id: 'node-note-reefroute',
        type: 'stickyNote',
        position: { x: 920, y: 780 },
        style: { width: 260, height: 200 },
        data: {
          title: 'Reef Navigation: Drang Corridors',
          content: 'Torvald\'s longships bypass the High Battery by running the razor basalt channels at low tide using peat-fire decoys (skiff-bait).',
          color: 'cyan',
          width: 260,
          height: 200
        }
      },
      {
        id: 'node-card-assassin',
        type: 'canvasCard',
        position: { x: 1320, y: 780 },
        style: { width: 190, height: 260 },
        data: {
          title: 'The Unseen Assassin',
          subtitle: 'Southern Imperial Envoy (Wanted)',
          avatar: null,
          attribution: undefined,
          artAttribution: undefined,
          width: 190,
          height: 260
        }
      }
    ],
    edges: [
      {
        id: 'edge-corvus-julian',
        source: 'node-card-corvus',
        target: 'node-card-julian',
        type: 'smoothstep',
        label: 'Hunting the Killers',
        style: { stroke: '#f43f5e', strokeDasharray: '5,5', strokeWidth: 2 }
      },
      {
        id: 'edge-julian-autopsy',
        source: 'node-card-julian',
        target: 'node-note-autopsy',
        type: 'smoothstep',
        label: 'Forensic Findings',
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      },
      {
        id: 'edge-corvus-decree',
        source: 'node-card-corvus',
        target: 'node-doc-decree',
        type: 'smoothstep',
        label: 'Martial Curfew',
        style: { stroke: '#64748b', strokeWidth: 2 }
      },
      {
        id: 'edge-corvus-lysandra',
        source: 'node-card-corvus',
        target: 'node-card-lysandra',
        type: 'smoothstep',
        label: 'Uneasy Council',
        style: { stroke: '#38bdf8', strokeWidth: 2 }
      },
      {
        id: 'edge-lysandra-manifest',
        source: 'node-card-lysandra',
        target: 'node-note-manifest',
        type: 'smoothstep',
        label: 'Secret Grain Reserve',
        style: { stroke: '#f59e0b', strokeWidth: 2 }
      },
      {
        id: 'edge-lysandra-covenant',
        source: 'node-card-lysandra',
        target: 'node-card-covenant',
        type: 'smoothstep',
        label: 'Guild Diplomat',
        style: { stroke: '#64748b', strokeWidth: 2 }
      },
      {
        id: 'edge-corvus-morwenna',
        source: 'node-card-corvus',
        target: 'node-card-morwenna',
        type: 'smoothstep',
        label: 'Theological War',
        style: { stroke: '#ef4444', strokeWidth: 2 }
      },
      {
        id: 'edge-morwenna-liturgy',
        source: 'node-card-morwenna',
        target: 'node-card-liturgy',
        type: 'smoothstep',
        label: 'High Suprema',
        style: { stroke: '#a855f7', strokeWidth: 2 }
      },
      {
        id: 'edge-morwenna-decree',
        source: 'node-card-morwenna',
        target: 'node-note-inquisition',
        type: 'smoothstep',
        label: 'Holy Edict',
        style: { stroke: '#a855f7', strokeWidth: 2 }
      },
      {
        id: 'edge-corvus-torvald',
        source: 'node-card-corvus',
        target: 'node-card-torvald',
        type: 'smoothstep',
        label: 'Blood Brothers at Sea',
        style: { stroke: '#f59e0b', strokeDasharray: '5,5', strokeWidth: 2 }
      },
      {
        id: 'edge-torvald-gold',
        source: 'node-card-torvald',
        target: 'node-note-goldcoins',
        type: 'smoothstep',
        label: 'Recovered Evidence',
        style: { stroke: '#eab308', strokeWidth: 2 }
      },
      {
        id: 'edge-gold-assassin',
        source: 'node-note-goldcoins',
        target: 'node-card-assassin',
        type: 'smoothstep',
        label: 'Contract Payment',
        style: { stroke: '#f43f5e', strokeDasharray: '3,3', strokeWidth: 2 }
      },
      {
        id: 'edge-torvald-skell',
        source: 'node-card-torvald',
        target: 'node-card-skellisles',
        type: 'smoothstep',
        label: 'Home Anchorage',
        style: { stroke: '#06b6d4', strokeWidth: 2 }
      }
    ],
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
  },
  {
    id: 'item-dict-high-ostergardic',
    worldId: 'world-ostergard',
    name: 'Conlang: High Ostergardic',
    type: 'dictionary',
    targetId: 'lang-ostergardic',
    folderId: null,
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
    id: 'tab-conlang',
    title: 'High Ostergardic Lexicon',
    type: 'dictionary',
    targetId: 'lang-ostergardic',
    isClosable: true
  }
]

export const sampleConlangs: ConlangLanguage[] = [
  {
    id: 'lang-ostergardic',
    worldId: 'world-ostergard',
    name: 'High Ostergardic',
    family: 'Archaic Boreal Court Dialect',
    description: 'The ancient, guttural court tongue of the salt-cliff nobility. Utilized during ducal councils, treaties, and sacred oaths of fealty over drawn cold steel.',
    writingSystem: 'Angular Runic Script',
    phonologyNotes: 'Glottal stops, heavy sibilants, rolled rhotic r-sounds, and clipped diphthongs.',
    color: '#38bdf8',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    words: [
      {
        id: 'word-skjaldmaer',
        languageId: 'lang-ostergardic',
        term: 'Skjaldmær',
        phonetic: '/ˈskjɑld.mæːr/',
        partOfSpeech: 'noun',
        definition: 'A sworn shield-bearer of the ducal vanguard pledged by blood to die before the ruling lord falls.',
        etymology: 'Proto-Boreal skjald (shield) + mær (maiden/sworn warrior)',
        aliases: ['skjaldmeyjar', 'skjaldmaer', 'skjald-bearer'],
        examples: [
          {
            original: 'The duke rode with nine skjaldmær at his flanks through the mountain pass.',
            translation: 'The lord traveled protected by his sworn vanguard.'
          }
        ],
        relatedEntityId: 'char-corvus',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-khorash',
        languageId: 'lang-ostergardic',
        term: 'Khorash',
        phonetic: '[kho-RASH]',
        partOfSpeech: 'noun',
        definition: 'The sacred irrevocable oath of salt and iron sworn over an unsheathed blade. Breach is punished by ceremonial drowning.',
        etymology: 'Skaelish khor (unforgiving iron) + ash (breath/vow)',
        aliases: ['khorashim', 'khor-vow'],
        examples: [
          {
            original: 'He invoked the Khorash before the Basalt Council, silencing every guildmaster.',
            translation: 'He bound them all to the iron oath.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-drang',
        languageId: 'lang-ostergardic',
        term: 'Drang',
        phonetic: '[drahng]',
        partOfSpeech: 'noun',
        definition: 'A sheer, wave-carved basalt sea stack or razor reef corridor where ships break in storms.',
        etymology: 'Norse/Boreal drangr (isolated sea pillar)',
        aliases: ['drangar'],
        examples: [
          {
            original: 'No war galley can navigate the inner drang in a northern squall.',
            translation: 'The cliffs smash any warship attempting the narrow channel.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-valen-geld',
        languageId: 'lang-ostergardic',
        term: 'Valen-Geld',
        phonetic: '[VAH-len geld]',
        partOfSpeech: 'noun',
        definition: 'A clandestine blood-tithe tribute paid by coastal town reeves to corsairs to preserve winter wheat stores.',
        etymology: 'Valen (slain/spared) + Geld (coin tribute)',
        aliases: ['valengeld', 'geld'],
        examples: [
          {
            original: 'The port guild quietly levied a valen-geld to keep Torvald from burning the warehouses.',
            translation: 'They paid the outlaw toll in gold.'
          }
        ],
        relatedEntityId: 'char-torvald',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-salthird',
        languageId: 'lang-ostergardic',
        term: 'Salthird',
        phonetic: '[SALT-heerd]',
        partOfSpeech: 'noun',
        definition: 'The elite standing ducal marine guard, trained for amphibious boarding actions and citadel gate defense.',
        etymology: 'Salt (ocean brine) + Hird (sovereign armed retinue)',
        aliases: ['salthirdmen', 'salt-hird'],
        examples: [
          {
            original: 'At first horn, the Salthird locked shields across the watergate.',
            translation: 'The marine guard sealed the harbor entrance.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-mork-tid',
        languageId: 'lang-ostergardic',
        term: 'Mørk-Tid',
        phonetic: '[MORK-teed]',
        partOfSpeech: 'noun',
        definition: 'The sixty-day solar twilight of the deep bitter freeze when sea ice locks the fjords.',
        etymology: 'Mørk (murk/darkness) + Tid (season/era)',
        aliases: ['morktid', 'the dark tide'],
        examples: [
          {
            original: 'During the Mørk-Tid, starving wolf-packs cross the frozen bay from the outer skerries.',
            translation: 'In the deep winter gloom, beasts roam across the ocean ice.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-cinder-hearth',
        languageId: 'lang-ostergardic',
        term: 'Cinder-Hearth',
        phonetic: '[SIN-der harth]',
        partOfSpeech: 'noun',
        definition: 'The sacred undying peat fire in Dun Carrow, burning continuously since Duke Alden I.',
        etymology: 'Proto-Boreal cinder + hearth',
        aliases: ['cinderhearth', 'sacred hearth'],
        examples: [
          {
            original: 'All sovereign decrees must be sealed before the Cinder-Hearth.',
            translation: 'All ducal laws are ratified before the flame.'
          }
        ],
        relatedEntityId: 'loc-dun-carrow',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-blod-galdr',
        languageId: 'lang-ostergardic',
        term: 'Blod-Galdr',
        phonetic: '[BLODE gahl-der]',
        partOfSpeech: 'noun',
        definition: 'An ancient runic blood-curse invoked during formal duel challenges on the basalt flagging.',
        etymology: 'Blod (blood) + Galdr (incantation/sorcery)',
        aliases: ['blodgaldr', 'blood curse'],
        examples: [
          {
            original: 'Morwenna hissed a Blod-Galdr under her cowl as the council adjourned.',
            translation: 'She cursed them with the ancient blood-rite.'
          }
        ],
        relatedEntityId: 'char-morwenna',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  },
  {
    id: 'lang-skaelish',
    worldId: 'world-ostergard',
    name: 'Skaelish Runespeak',
    family: 'Outer Isles Reaver Cant',
    description: 'A clipped, sea-slurred dialect spoken by outlaws, galley oarsmen, and salt-smugglers of the Low Skerries.',
    writingSystem: 'Notched Driftwood Carvings',
    color: '#f43f5e',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    words: [
      {
        id: 'word-draugr-helm',
        languageId: 'lang-skaelish',
        term: 'Draugr-Helm',
        phonetic: '[DRAW-ger helm]',
        partOfSpeech: 'noun',
        definition: 'An iron skull-cap visor blackened with cuttlefish ink, worn by exiled raiders condemned to drown if captured.',
        etymology: 'Draugr (drowned dead) + Helm (casque)',
        aliases: ['draugrhelm'],
        examples: [
          {
            original: 'Torvald threw back his draugr-helm to taste the spray.',
            translation: 'The outlaw captain unveiled his scarred face.'
          }
        ],
        relatedEntityId: 'char-torvald',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-skiff-bait',
        languageId: 'lang-skaelish',
        term: 'Skiff-Bait',
        phonetic: '[SKIFF bayt]',
        partOfSpeech: 'idiom',
        definition: 'A deliberate naval ruse: burning peat on a decoy barge to lure heavy garrison galleys onto shallow reefs.',
        aliases: ['skiffbait'],
        examples: [
          {
            original: 'They took the burning hull for a merchant prizes—foolish skiff-bait.',
            translation: 'They fell straight into the corsair trap.'
          }
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-gallow-skua',
        languageId: 'lang-skaelish',
        term: 'Gallow-Skua',
        phonetic: '[GAL-oh SKOO-ah]',
        partOfSpeech: 'noun',
        definition: 'A scavenger sea bird associated with maritime gibbets and drowned sailors along the Skerries.',
        aliases: ['gallowskua', 'skua'],
        examples: [
          {
            original: 'The gallow-skuas circled above the reef where the grain-hulk foundered.',
            translation: 'The birds gathered over the wreck.'
          }
        ],
        relatedEntityId: 'loc-skell-isles',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'word-barrow-brine',
        languageId: 'lang-skaelish',
        term: 'Barrow-Brine',
        phonetic: '[BAH-roh bryne]',
        partOfSpeech: 'noun',
        definition: 'Acidic, black bog-water used by marsh smugglers to preserve stolen metal weapons and hide them from border lances.',
        aliases: ['barrowbrine'],
        examples: [
          {
            original: 'They pulled six broadswords from the barrow-brine without a speck of rust.',
            translation: 'The weapons were preserved in the bog.'
          }
        ],
        relatedEntityId: 'loc-mor-marshes',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
]


