<script setup lang="ts">
import * as Y from 'yjs'
import { computed, onMounted, onUnmounted, ref } from 'vue'

import NavigationBar from './components/NavigationBar.vue'
import Room from './components/Room.vue'
import RollHistory from './components/RollHistory.vue'
import {
  fellowshipOrder,
  fellowships,
  heroOrder,
  heroes,
  situationOrder,
  situations,
} from './lib/yjs'
import {
  createHeroShard,
  createHeroShardFromData,
  getHeroCharacterNameFromData,
  parseHeroDataFromYaml,
} from './lib/Hero'
import Hero from './components/Hero.vue'
import Fellowship from './components/Fellowship.vue'
import {
  createFellowshipShard,
  createFellowshipShardFromData,
  getFellowshipNameFromData,
  parseFellowshipDataFromYaml,
} from './lib/Fellowship'
import Situation from './components/Situation.vue'
import {
  createSituationShard,
  createSituationShardFromData,
  getSituationNameFromData,
  parseSituationDataFromYaml,
} from './lib/Situation'
import { useDragDrop } from './lib/util'
import { mightOptions, type Might } from './lib/schema'
import { mightIcon } from './lib/mightIcons'
import { useOutdatedClient } from './lib/buildVersion'

type HeroEntry = {
  name: string
  characterName: string
  shard: Y.Map<any>
}

type FellowshipEntry = {
  name: string
  fellowshipName: string
  shard: Y.Map<any>
}

type SituationEntry = {
  name: string
  situationName: string
  shard: Y.Map<any>
}

const outdatedClient = useOutdatedClient()

function reloadForUpdate() {
  window.location.reload()
}

const newSituationName = ref('')
const newSituationBaseMight = ref<Might | ''>('')
const situationNames = ref<string[]>([])
const showSituationForm = ref(false)
const showSituationImportForm = ref(false)
const situationYamlText = ref('')
const situationImportError = ref('')

const newFellowshipName = ref('')
const fellowshipNames = ref<string[]>([])
const showFellowshipForm = ref(false)
const showFellowshipImportForm = ref(false)
const fellowshipYamlText = ref('')
const fellowshipImportError = ref('')

const newHeroCharacterName = ref('')
const newHeroPlayerName = ref('')
const heroNames = ref<string[]>([])
const showHeroForm = ref(false)
const showHeroImportForm = ref(false)
const heroYamlText = ref('')
const heroImportError = ref('')

const randomHeroFirstNameSyllables = [
  'a', 'ah', 'ai', 'al', 'ama', 'an', 'ara', 'ari', 'ar', 'as', 'ast', 'ava', 'avel', 'az',
  'ba', 'bar', 'baz', 'bel', 'ben', 'bla', 'bo', 'bri', 'brin', 'bro', 'bryn', 'bus',
  'ca', 'cal', 'cas', 'cel', 'cha', 'chi', 'cia', 'cin', 'cor', 'cy',
  'da', 'daz', 'del', 'den', 'di', 'dia', 'dol', 'dra', 'dri', 'du',
  'e', 'el', 'ela', 'ella', 'em', 'en', 'eri', 'etta', 'ev', 'ez',
  'fa', 'fab', 'fal', 'fen', 'fer', 'fi', 'fia', 'flux', 'foo', 'fyr',
  'ga', 'gal', 'gar', 'gel', 'gin', 'go', 'gorm', 'gra', 'gri',
  'ha', 'hal', 'han', 'har', 'hel', 'hol', 'hy',
  'ia', 'ian', 'ilya', 'in', 'io', 'ir', 'is', 'iva',
  'ja', 'jan', 'jen', 'jer', 'jim', 'jo', 'jor', 'jun',
  'ka', 'kai', 'kal', 'kel', 'kes', 'ki', 'kira', 'ko', 'kol', 'kor', 'ky',
  'la', 'lan', 'lar', 'le', 'lei', 'len', 'li', 'lia', 'lio', 'lis', 'lor', 'lu',
  'ma', 'mal', 'mar', 'mei', 'mel', 'mi', 'mira', 'mo', 'mor',
  'na', 'nai', 'nal', 'nel', 'ni', 'nia', 'no', 'nor', 'ny',
  'o', 'ol', 'ora', 'ori', 'or', 'os',
  'pa', 'pam', 'pel', 'per', 'pire', 'po', 'pra', 'pri',
  'qua', 'qui', 'quin',
  'ra', 'rai', 'ral', 'ren', 'ria', 'riel', 'ril', 'ro', 'ron', 'ryn',
  'sa', 'sai', 'sal', 'sel', 'sha', 'she', 'si', 'sia', 'sol', 'sor', 'su',
  'ta', 'tan', 'taur', 'tel', 'the', 'thi', 'ti', 'tia', 'tor', 'trel', 'tu',
  'ul', 'um', 'una', 'ur',
  'va', 'val', 'vam', 'ven', 'ver', 'vi', 'via', 'vo', 'vue',
  'wa', 'wil', 'wre', 'wyn',
  'xa', 'xal', 'xel', 'xi',
  'ya', 'yel', 'yo', 'yor', 'ys',
  'za', 'zal', 'zen', 'zi', 'zor',
]
function randomSyllable() {
  return randomHeroFirstNameSyllables[Math.floor(Math.random() * randomHeroFirstNameSyllables.length)]
}

const randomHeroLastNameParts = [
  'tree', 'beech', 'ash', 'maple', 'pine', 'birch', 'willow', 'palm', 'sakura', 'oak',
  'beast', 'lion', 'tiger', 'bear', 'deer', 'fox', 'wolf', 'ape', 'elk', 'moose', 'horse', 'pony', 'dog', 'cat', 'hog', 'monkey', 'yak', 'hound',
  'vermin', 'gopher', 'rat', 'mouse', 'shrew', 'ferret', 'stoat', 'weasel', 'skunk', 'badger',
  'pangolin', 'koala', 'hippo', 'zebra',
  'snake', 'cobra', 'viper', 'asp', 'garter', 'anaconda',
  'lizard', 'salamander', 'monitor', 'basilisk', 'gecko', 'chameleon',
  'frog', 'toad', 'newt',
  'fish', 'trout', 'bass', 'marlin', 'perch', 'tuna', 'shark', 'whale',
  'eel', 'squid', 'clam', 'oyster', 'slug', 'snail',
  'bug', 'cricket', 'spider', 'wasp', 'hornet', 'scorpion',
  'horn', 'hoof', 'beak', 'claw', 'talon', 'feather', 'paw', 'pelt', 'hyde',
  'bird', 'hawk', 'robin', 'lark', 'pecker', 'raptor', 'phoenix', 'raven', 'crow', 'gull', 'pelican', 'penguin', 'albatross', 'eagle', 'condor', 'owl',
  'flower', 'rose', 'tulip', 'daisy', 'violet', 'dalia',
  'sky', 'sun', 'moon', 'cloud', 'dawn', 'dusk', 'rainbow', 'star', 'comet', 'nimbus',
  'weather', 'storm', 'gale', 'deluge', 'hale', 'sleet', 'thunder', 'zephyr', 'puff', 'gust', 'rain', 'mist', 'fog', 'rime', 'dew', 'breeze', 'tempest', 'maelstrom', 'torrent', 'tide', 'squall',
  'glow', 'aura', 'streak', 'haze', 'bolt', 'strike', 'flare', 'halo', 'shine', 'bright',
  'man', 'son', 'burger', 'well', 'wild', 'mere', 'moto', 'hime', 'ly', 'ward', 'holt', 'berg',
  'worker', 'maker', 'smith', 'strider', 'hunter', 'trapper', 'marker', 'baker', 'caster', 'mason', 'gard', 'shutter', 'piper', 'singer', 'camper', 'chanter', 'cantor', 'porter', 'wright', 'angler', 'packer', 'keeper', 'seeker', 'hander', 'gofer', 'getter', 'setter', 'walker', 'finder', 'stalker',
  'father', 'mother', 'brother', 'sister', 'child', 'sire', 'kin',
  'jump', 'clap', 'snap', 'punch', 'sweep', 'step', 'leap', 'flip', 'hop', 'sprint',
  'tron', 'trax', 'meta', 'mega',
  'monster', 'gorgon', 'minotaur', 'centaur', 'scylla', 'charibdis', 'kraken', 'chimera',
  'dragon', 'drake', 'draco', 'dragoon',
  'fire', 'flame', 'char', 'cinder', 'lava', 'magma', 'smoke', 'ember',
  'twig', 'stick', 'spark', 'plume', 'blaze', 'leaf', 'root', 'trunk',
  'earth', 'land', 'bluff', 'crest', 'ridge', 'peak', 'mount', 'hill', 'chasm', 'canyon', 'mesa', 'quarry', 'burm',
  'water', 'river', 'spring', 'stream', 'brook', 'estuary', 'lake', 'grotto', 'creek', 'droplet', 'pool', 'wake',
  'ice', 'frost', 'snow',
  'swamp', 'marsh', 'mire',
  'forest', 'grove', 'copse', 'glen', 'dale', 'wood', 'bush', 'vine', 'vale',
  'meadow', 'field', 'prairie', 'moor', 'heather', 'bramble', 'thorn', 'briar', 'reed',
  'harbor', 'harbour', 'port', 'isle', 'strand', 'shore', 'cliff', 'fjord', 'fen',
  'silver', 'gold', 'copper', 'iron', 'lead', 'crystal', 'bronze', 'glass',
  'near', 'over', 'under', 'far',
  'fruit', 'melon', 'apple', 'banana', 'orange', 'pear', 'peach', 'grape', 'fig',
  'fever', 'rage', 'spirit', 'soul', 'love', 'sing', 'fair',
  'fall', 'winter', 'summer', 'autumn',
  'red', 'yellow', 'green', 'blue', 'black', 'white', 'gray', 'grey',
  'crimson', 'vermillion', 'scarlet', 'argent', 'auric',
  'steam', 'cog', 'clog', 'pipe', 'lens', 'spanner', 'strut', 'stud', 'wheel', 'gear',
  'hearth', 'spire', 'camp', 'castle', 'tower', 'bridge', 'stool', 'chair', 'throne', 'hedge', 'shrine', 'sanctum',
  'home', 'shire', 'town', 'folk', 'haven',
  'helm', 'shield', 'spear', 'sword', 'pike', 'saber', 'blade', 'brand', 'edge', 'hilt', 'guard', 'mail', 'banner', 'standard', 'mark',
  'king', 'queen', 'duke', 'earl', 'count',
  'monk', 'abbot', 'mage', 'sage', 'vicar', 'scribe', 'oracle',
  'rune', 'sigil', 'glyph', 'warding', 'charm', 'omen', 'relic',
  'veil', 'shadow', 'shade', 'twilight', 'eclipse', 'lantern', 'candle', 'beacon', 'torch',
  'stone', 'granite', 'marble', 'basalt', 'slate', 'flint', 'onyx', 'opal', 'jade', 'amber',
  'quartz', 'pearl', 'ruby', 'sapphire', 'emerald', 'topaz', 'amethyst',
  'cypress', 'cedar', 'yew', 'elm', 'fir', 'spruce', 'laurel', 'rowan',
  'path', 'road', 'trail', 'crossing', 'gate', 'arch', 'wall', 'keep', 'citadel',
  'forge', 'anvil', 'hammer', 'bellows', 'kiln', 'loom', 'needle', 'thread', 'quill',
  'vow', 'oath', 'truth', 'grace', 'mercy', 'valor', 'honor', 'glory', 'hope', 'bond',
  'dream', 'whisper', 'echo', 'song', 'chord', 'lyre', 'harp', 'drum',
  'north', 'south', 'east', 'west', 'high', 'low', 'deep',
  'elder', 'young', 'true', 'bold', 'grim', 'quick', 'still', 'quiet', 'keen',
  'acorn', 'aspen', 'bay', 'bloom', 'bough', 'branch', 'bud', 'clover', 'fern', 'frond',
  'hazel', 'holly', 'ivy', 'juniper', 'lily', 'lotus', 'moss', 'myrtle', 'nettle', 'orchid',
  'petal', 'sap', 'thistle', 'wisteria', 'clove', 'hyssop', 'mossroot', 'seed', 'sprig', 'tangle',
  'aurora', 'daybreak', 'eventide', 'midnight', 'noon', 'nightfall', 'moonrise', 'starlight',
  'sunrise', 'sunset', 'solstice', 'equinox', 'zenith', 'nadir', 'nebula', 'nova',
  'wind', 'whirlwind', 'cyclone', 'downpour', 'drizzle', 'hail', 'monsoon', 'spray',
  'surge', 'wave', 'breaker', 'current', 'rapids', 'flood', 'foam', 'rainfall',
  'boulder', 'cairn', 'cobble', 'crag', 'dust', 'geode', 'gravel', 'loam', 'ore', 'pebble',
  'sand', 'scree', 'shale', 'summit', 'tor', 'valley', 'chalk', 'clay', 'dune', 'hollow',
  'agate', 'beryl', 'carnelian', 'garnet', 'ivory', 'jasper', 'lapis', 'moonstone',
  'obsidian', 'peridot', 'sunstone', 'turquoise', 'zircon', 'adamant', 'mithril',
  'barrow', 'bastion', 'borough', 'chapel', 'court', 'courtyard', 'dungeon', 'fort',
  'hall', 'hamlet', 'hold', 'manor', 'market', 'mill', 'monastery', 'palace',
  'rampart', 'ruin', 'square', 'temple', 'village', 'wharf', 'alley', 'causeway',
  'aegis', 'arrow', 'axe', 'buckler', 'chain', 'dagger', 'gauntlet', 'glaive',
  'lance', 'longbow', 'mace', 'quiver', 'scabbard', 'staff', 'trident', 'armory',
  'artifice', 'augur', 'blessing', 'cipher', 'conjure', 'covenant', 'fable', 'fate',
  'fortune', 'hex', 'legend', 'mantle', 'miracle', 'mystic', 'pact', 'prophet',
  'spell', 'talisman', 'vision', 'wonder', 'mystery', 'portent', 'rite', 'secret',
  'anklet', 'bracelet', 'brooch', 'circlet', 'cloak', 'crown', 'diadem', 'garland',
  'gown', 'mantlet', 'mask', 'ring', 'robe', 'sash', 'vestment',
  'alewife', 'archer', 'bard', 'brewer', 'carver', 'chandler', 'cook', 'cooper',
  'draper', 'dyer', 'falconer', 'farrier', 'fletcher', 'glazier', 'harper', 'jester',
  'joiner', 'minstrel', 'potter', 'ranger', 'sailor', 'tailor', 'tanner', 'tiler',
  'banneret', 'captain', 'champion', 'herald', 'knight', 'marshal', 'paladin', 'warden',
  'advent', 'ardor', 'balance', 'candor', 'courage', 'delight', 'desire', 'devotion',
  'dread', 'envy', 'fervor', 'joy', 'kindle', 'luck', 'memory', 'patience',
  'promise', 'resolve', 'reverie', 'sorrow', 'triumph', 'wisdom', 'solace', 'yearning',
  'after', 'before', 'middle', 'inner', 'outer', 'upper', 'nether', 'hidden',
  'lost', 'old', 'new', 'brave', 'clear', 'dark', 'fierce', 'gentle',
  'golden', 'lone', 'proud', 'rough', 'silvered', 'small', 'strong', 'swift',
  'tall', 'wide', 'ashen', 'brighten', 'distant', 'noble', 'steadfast', 'wilding',
  'circle', 'crescent', 'crownmark', 'knot', 'labyrinth', 'mirror', 'pillar', 'prism',
  'scroll', 'seal', 'shard', 'spiral', 'vessel', 'wreath', 'anchor', 'chalice',
  'compass', 'key', 'lock', 'window', 'belfry', 'gable', 'lintel', 'threshold',
  'full', 'all', 'prime', 'victor', 'grand',
  'bone', 'tooth', 'blight', 'abyss', 'inferno', 'paradiso', 'devil', 'daemon', 'fey', 'person', 'angel', 'math',
  'sound', 'xeno', 'weaver', 'balloon', 'loon', 'sphere', 'tesseract', 'orb', 'pixie', 'faun', 'nexus', 'azure',
  'altar', 'half', 'quarter', 'vortex', 'elven', 'beard', 'bouquet', 'cornucopia', 'spice', 'falcon',
  'triarch', 'hegemon', 'haunt', 'ghost', 'sweet', 'sour', 'loud', 'silent', 'sharp', 'soft', 'floral',
  'volcano', 'caldera', 'axel', 'sheppard', 'moebius', 'beaver', 'otter', 'rabbit', 'velvet',
]
function randomLastNamePart() {
  return randomHeroLastNameParts[Math.floor(Math.random() * randomHeroLastNameParts.length)]
}

const randomHeroicPunctuation = [
  "'", '-'
]
function randomPunctuation() {
  return randomHeroicPunctuation[Math.floor(Math.random() * randomHeroicPunctuation.length)]
}

function normalizeOrderedNames(map: Y.Map<any>, order: Y.Array<string>) {
  const keys = Array.from(map.keys())
    .filter((name): name is string => typeof name === 'string' && !!name.trim())
  const keySet = new Set(keys)
  const seen = new Set<string>()
  const normalized: string[] = []

  order.toArray().forEach(name=> {
    if (!keySet.has(name) || seen.has(name)) return
    seen.add(name)
    normalized.push(name)
  })

  keys.forEach(name=> {
    if (seen.has(name)) return
    seen.add(name)
    normalized.push(name)
  })

  const current = order.toArray()
  const changed = (
    current.length !== normalized.length
    || current.some((name, index)=> name !== normalized[index])
  )

  if (changed) {
    order.doc?.transact(()=> {
      order.delete(0, order.length)
      order.insert(0, normalized)
    })
  }

  return normalized
}

function moveOrderedName(order: Y.Array<string>, from: number, to: number) {
  if (from === to) return
  const name = order.get(from)
  if (!name) return

  order.doc?.transact(()=> {
    order.delete(from, 1)
    order.insert(to, [name])
  })
}

function appendOrderedName(order: Y.Array<string>, name: string) {
  if (order.toArray().includes(name)) return
  order.push([name])
}

function syncSituationNames() {
  situationNames.value = normalizeOrderedNames(situations, situationOrder)
}

function syncFellowshipNames() {
  fellowshipNames.value = normalizeOrderedNames(fellowships, fellowshipOrder)
}

function syncHeroNames() {
  heroNames.value = normalizeOrderedNames(heroes, heroOrder)
}

const observer = ()=> {
  syncSituationNames()
  syncFellowshipNames()
  syncHeroNames()
}

onMounted(()=> {
  syncSituationNames()
  syncFellowshipNames()
  syncHeroNames()
  situations.observe(observer)
  situationOrder.observe(observer)
  fellowships.observe(observer)
  fellowshipOrder.observe(observer)
  heroes.observe(observer)
  heroOrder.observe(observer)
})

onUnmounted(()=> {
  situations.unobserve(observer)
  situationOrder.unobserve(observer)
  fellowships.unobserve(observer)
  fellowshipOrder.unobserve(observer)
  heroes.unobserve(observer)
  heroOrder.unobserve(observer)
})

const {
  onDrag: onSituationDrag,
  onDrop: onSituationDrop,
} = useDragDrop((from, to)=> moveOrderedName(situationOrder, from, to), syncSituationNames)

const {
  onDrag: onFellowshipDrag,
  onDrop: onFellowshipDrop,
} = useDragDrop((from, to)=> moveOrderedName(fellowshipOrder, from, to), syncFellowshipNames)

const {
  onDrag: onHeroDrag,
  onDrop: onHeroDrop,
} = useDragDrop((from, to)=> moveOrderedName(heroOrder, from, to), syncHeroNames)

type TopLevelDragKind = 'situation' | 'fellowship' | 'hero'
let activeTopLevelDrag: TopLevelDragKind | null = null

function startedOnTopLevelDraggable(event: DragEvent) {
  const target = event.target
  const currentTarget = event.currentTarget
  if (!(target instanceof Element)) return false
  if (!(currentTarget instanceof HTMLElement)) return false

  return target.closest('[draggable="true"]') === currentTarget
}

function handleTopLevelDragStart(
  event: DragEvent,
  kind: TopLevelDragKind,
  index: number,
  onDrag: (index: number)=> void,
) {
  if (!startedOnTopLevelDraggable(event)) {
    activeTopLevelDrag = null
    return
  }

  activeTopLevelDrag = kind
  onDrag(index)
}

function handleTopLevelDrop(
  kind: TopLevelDragKind,
  index: number,
  onDrop: (index: number)=> void,
) {
  if (activeTopLevelDrag !== kind) return

  onDrop(index)
  activeTopLevelDrag = null
}

function clearTopLevelDrag() {
  activeTopLevelDrag = null
}

const situationEntries = computed(()=>
  situationNames.value
    .map(name=> {
      const shard = situations.get(name)
      const shardSituationName = shard?.get('situationName')
      const situationName = typeof shardSituationName === 'string' && shardSituationName.trim()
        ? shardSituationName
        : name

      return {
        name,
        situationName,
        shard
      }
    })
    .filter((entry): entry is SituationEntry=> !!entry.shard)
)

const fellowshipEntries = computed(()=>
  fellowshipNames.value
    .map(name=> {
      const shard = fellowships.get(name)
      const shardFellowshipName = shard?.get('fellowshipName')
      const fellowshipName = typeof shardFellowshipName === 'string' && shardFellowshipName.trim()
        ? shardFellowshipName
        : name

      return {
        name,
        fellowshipName,
        shard
      }
    })
    .filter((entry): entry is FellowshipEntry=> !!entry.shard)
)

const heroEntries = computed(()=>
  heroNames.value
    .map(name=> {
      const shard = heroes.get(name)
      const shardCharacterName = shard?.get('characterName')
      const characterName = typeof shardCharacterName === 'string' && shardCharacterName.trim()
        ? shardCharacterName
        : name

      return {
        name,
        characterName,
        shard
      }
    })
    .filter((entry): entry is HeroEntry=> !!entry.shard)
)

function heroId(characterName: string) {
  return `hero-${encodeURIComponent(characterName)}`
}

function situationId(situationName: string) {
  return `situation-${encodeURIComponent(situationName)}`
}

function fellowshipId(fellowshipName: string) {
  return `fellowship-${encodeURIComponent(fellowshipName)}`
}

function addSituation() {
  const situationName = newSituationName.value.trim()
  const baseMight = newSituationBaseMight.value
  if (!situationName || !baseMight || situations.has(situationName)) return

  situations.set(situationName, createSituationShard({ situationName, baseMight }))
  appendOrderedName(situationOrder, situationName)
  newSituationName.value = ''
  newSituationBaseMight.value = ''
}

function openSituationForm() {
  showSituationForm.value = true
}

function closeSituationForm() {
  showSituationForm.value = false
}

function openSituationImportForm() {
  situationImportError.value = ''
  showSituationImportForm.value = true
}

function closeSituationImportForm() {
  showSituationImportForm.value = false
  situationImportError.value = ''
}

function createSituationFromForm() {
  const situationName = newSituationName.value.trim()
  if (!situationName || !newSituationBaseMight.value || situations.has(situationName)) return

  addSituation()
  closeSituationForm()
}

function importSituationFromYaml() {
  situationImportError.value = ''

  try {
    const situationData = parseSituationDataFromYaml(situationYamlText.value)
    const situationName = getSituationNameFromData(situationData)

    if (!situationName) {
      situationImportError.value = 'Situation YAML needs a situation name'
      return
    }

    if (situations.has(situationName)) {
      situationImportError.value = 'A situation with that name already exists'
      return
    }

    const situationShard = createSituationShardFromData(situationData)
    situations.set(situationName, situationShard)
    appendOrderedName(situationOrder, situationName)
    situationYamlText.value = ''
    closeSituationImportForm()
  } catch (e) {
    situationImportError.value = e instanceof Error ? e.message : 'Invalid situation YAML'
  }
}

function addFellowship() {
  const fellowshipName = newFellowshipName.value.trim()
  if (!fellowshipName || fellowships.has(fellowshipName)) return

  fellowships.set(fellowshipName, createFellowshipShard({ fellowshipName }))
  appendOrderedName(fellowshipOrder, fellowshipName)
  newFellowshipName.value = ''
}

function openFellowshipForm() {
  showFellowshipForm.value = true
}

function closeFellowshipForm() {
  showFellowshipForm.value = false
}

function openFellowshipImportForm() {
  fellowshipImportError.value = ''
  showFellowshipImportForm.value = true
}

function closeFellowshipImportForm() {
  showFellowshipImportForm.value = false
  fellowshipImportError.value = ''
}

function createFellowshipFromForm() {
  const fellowshipName = newFellowshipName.value.trim()
  if (!fellowshipName || fellowships.has(fellowshipName)) return

  addFellowship()
  closeFellowshipForm()
}

function importFellowshipFromYaml() {
  fellowshipImportError.value = ''

  try {
    const fellowshipData = parseFellowshipDataFromYaml(fellowshipYamlText.value)
    const fellowshipName = getFellowshipNameFromData(fellowshipData)

    if (!fellowshipName) {
      fellowshipImportError.value = 'Fellowship YAML needs a fellowship name'
      return
    }

    if (fellowships.has(fellowshipName)) {
      fellowshipImportError.value = 'A fellowship with that name already exists'
      return
    }

    const fellowshipShard = createFellowshipShardFromData(fellowshipData)
    fellowships.set(fellowshipName, fellowshipShard)
    appendOrderedName(fellowshipOrder, fellowshipName)
    fellowshipYamlText.value = ''
    closeFellowshipImportForm()
  } catch (e) {
    fellowshipImportError.value = e instanceof Error ? e.message : 'Invalid fellowship YAML'
  }
}

function addHero() {
  const characterName = newHeroCharacterName.value.trim()
  if (!characterName || heroes.has(characterName)) return
  const playerName = newHeroPlayerName.value.trim()
  if (!playerName) return

  heroes.set(characterName, createHeroShard({
    characterName, playerName
  }))
  appendOrderedName(heroOrder, characterName)
  newHeroCharacterName.value = ''
  newHeroPlayerName.value = ''
}

function openHeroForm() {
  showHeroForm.value = true
}

function closeHeroForm() {
  showHeroForm.value = false
}

function openHeroImportForm() {
  heroImportError.value = ''
  showHeroImportForm.value = true
}

function closeHeroImportForm() {
  showHeroImportForm.value = false
  heroImportError.value = ''
}

function createHeroFromForm() {
  const characterName = newHeroCharacterName.value.trim()
  const playerName = newHeroPlayerName.value.trim()
  if (!characterName || !playerName || heroes.has(characterName)) return

  addHero()
  closeHeroForm()
}

function importHeroFromYaml() {
  heroImportError.value = ''

  try {
    const heroData = parseHeroDataFromYaml(heroYamlText.value)
    const characterName = getHeroCharacterNameFromData(heroData)

    if (!characterName) {
      heroImportError.value = 'Hero YAML needs a character name'
      return
    }

    if (heroes.has(characterName)) {
      heroImportError.value = 'A hero with that character name already exists'
      return
    }

    const heroShard = createHeroShardFromData(heroData)
    heroes.set(characterName, heroShard)
    appendOrderedName(heroOrder, characterName)
    heroYamlText.value = ''
    closeHeroImportForm()
  } catch (e) {
    heroImportError.value = e instanceof Error ? e.message : 'Invalid hero YAML'
  }
}

function diceN(n: number) {
  return Math.floor(Math.random() * n) + 1
}
function testP(p: number) {
  return Math.random() < p;
}

function generateRandomGivenName() {
  let syllableCount = diceN(3) + diceN(2)
  while (testP(0.3)) {
    syllableCount += 1
  }
  const parts = []
  for (let i = 0; i < syllableCount; i += 1) {
    if (i > 0 && testP(0.01)) {
      parts.push(randomPunctuation())
    }
    let syllable = randomSyllable()
    if (i == 0 || testP(0.01)) {
      syllable = syllable[0].toUpperCase() + syllable.slice(1)
    }
    parts.push(syllable)
  }
  return parts.join('')
}

function generateRandomSurname() {
  let partCount = 2
  while (testP(0.15)) {
    partCount += 1
  }
  const parts = []
  for (let i = 0; i < partCount; i += 1) {
    if (i > 0 && testP(0.01)) {
      parts.push(randomPunctuation())
    }
    let part = randomLastNamePart()
    if (i == 0 || testP(0.01)) {
      part = part[0].toUpperCase() + part.slice(1)
    }
    parts.push(part)
  }
  return parts.join('')
}

function generateRandomFullName() {
  const names = []
  names.push(generateRandomGivenName())
  while (testP(0.05)) {
    names.push(generateRandomGivenName())
  }
  names.push(generateRandomSurname())
  while (testP(0.05)) {
    names.push(generateRandomSurname())
  }
  if (testP(0.002)) names.splice(-1, 0, 'the')

  return names.join(' ')
}

function generateRandomHeroName() {
  newHeroCharacterName.value = generateRandomFullName()
}

function deleteSituation(name: string) {
  situations.delete(name)
}

function deleteFellowship(name: string) {
  fellowships.delete(name)
}

function deleteHero(name: string) {
  heroes.delete(name)
}
</script>

<template>
  <main>
    <aside
      v-if="outdatedClient"
      class="update-warning"
      role="alert"
    >
      <span>A newer version of Theater of the Tags is available. Reload before continuing.</span>
      <button type="button" @click="reloadForUpdate">Reload now</button>
    </aside>
    <NavigationBar
      :situations="situationEntries"
      :fellowships="fellowshipEntries"
      :heroes="heroEntries"
    />
    <div class="app-body">
      <div class="app-content">
        <Room
          id="room"
          :situations="situationEntries"
          :fellowships="fellowshipEntries"
          :heroes="heroEntries"
          @add-situation="openSituationForm"
          @import-situation="openSituationImportForm"
          @add-fellowship="openFellowshipForm"
          @import-fellowship="openFellowshipImportForm"
          @add-hero="openHeroForm"
          @import-hero="openHeroImportForm"
        />

    <div
      v-if="showSituationForm"
      class="modal-backdrop"
      @click.self="closeSituationForm"
    >
      <form class="hero-form-modal situation-form-modal" @submit.prevent="createSituationFromForm">
        <h2>Create Situation</h2>

        <label class="form-field">
          <span>Situation Name</span>
          <input
            v-model="newSituationName"
            placeholder="Enter situation name"
          />
        </label>

        <fieldset class="form-field might-field">
          <legend>Base Might</legend>
          <label
            v-for="option in mightOptions"
            :key="option"
            class="might-choice"
            :title="option"
          >
            <input
              v-model="newSituationBaseMight"
              type="radio"
              name="new-situation-base-might"
              :value="option"
              required
              :aria-label="option"
            >
            <img :src="mightIcon(option)" :alt="option" class="might-choice-icon">
          </label>
        </fieldset>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeSituationForm">
            Cancel
          </button>
          <button
            type="submit"
            :disabled="!newSituationName.trim() || !newSituationBaseMight"
          >Create Situation</button>
        </div>
      </form>
    </div>
    <div
      v-if="showSituationImportForm"
      class="modal-backdrop"
      @click.self="closeSituationImportForm"
    >
      <form class="hero-form-modal situation-form-modal" @submit.prevent="importSituationFromYaml">
        <h2>Import Situation YAML</h2>

        <label class="form-field">
          <span>Situation YAML</span>
          <textarea
            v-model="situationYamlText"
            placeholder="Paste situation YAML"
            @input="situationImportError = ''"
          />
        </label>

        <p v-if="situationImportError" class="form-error">{{ situationImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeSituationImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!situationYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Situation
        v-for="(entry, index) in situationEntries"
        :id="situationId(entry.situationName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'situation', index, onSituationDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('situation', index, onSituationDrop)"
        @delete="deleteSituation(entry.name)"
      />
    </div>

    <div
      v-if="showFellowshipForm"
      class="modal-backdrop"
      @click.self="closeFellowshipForm"
    >
      <form class="hero-form-modal fellowship-form-modal" @submit.prevent="createFellowshipFromForm">
        <h2>Create Fellowship</h2>

        <label class="form-field">
          <span>Fellowship Name</span>
          <input
            v-model="newFellowshipName"
            placeholder="Enter fellowship name"
          />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeFellowshipForm">
            Cancel
          </button>
          <button type="submit">Create Fellowship</button>
        </div>
      </form>
    </div>
    <div
      v-if="showFellowshipImportForm"
      class="modal-backdrop"
      @click.self="closeFellowshipImportForm"
    >
      <form class="hero-form-modal fellowship-form-modal" @submit.prevent="importFellowshipFromYaml">
        <h2>Import Fellowship YAML</h2>

        <label class="form-field">
          <span>Fellowship YAML</span>
          <textarea
            v-model="fellowshipYamlText"
            placeholder="Paste fellowship YAML"
            @input="fellowshipImportError = ''"
          />
        </label>

        <p v-if="fellowshipImportError" class="form-error">{{ fellowshipImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeFellowshipImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!fellowshipYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Fellowship
        v-for="(entry, index) in fellowshipEntries"
        :id="fellowshipId(entry.fellowshipName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'fellowship', index, onFellowshipDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('fellowship', index, onFellowshipDrop)"
        @delete="deleteFellowship(entry.name)"
      />
    </div>

    <div
      v-if="showHeroForm"
      class="modal-backdrop"
      @click.self="closeHeroForm"
    >
      <form class="hero-form-modal" @submit.prevent="createHeroFromForm">
        <h2>Create Hero</h2>

        <label class="form-field">
          <span>Character Name</span>
          <div class="character-name-row">
            <input
              v-model="newHeroCharacterName"
              placeholder="Enter character name"
            />
            <button
              type="button"
              class="secondary-button"
              @click="generateRandomHeroName"
            >
              Random
            </button>
          </div>
        </label>

        <label class="form-field">
          <span>Player Name</span>
          <input
            v-model="newHeroPlayerName"
            placeholder="Enter player name"
          />
        </label>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeHeroForm">
            Cancel
          </button>
          <button type="submit">Create Hero</button>
        </div>
      </form>
    </div>
    <div
      v-if="showHeroImportForm"
      class="modal-backdrop"
      @click.self="closeHeroImportForm"
    >
      <form class="hero-form-modal" @submit.prevent="importHeroFromYaml">
        <h2>Import Hero YAML</h2>

        <label class="form-field">
          <span>Hero YAML</span>
          <textarea
            v-model="heroYamlText"
            placeholder="Paste hero YAML"
            @input="heroImportError = ''"
          />
        </label>

        <p v-if="heroImportError" class="form-error">{{ heroImportError }}</p>

        <div class="modal-actions">
          <button type="button" class="secondary-button" @click="closeHeroImportForm">
            Cancel
          </button>
          <button type="submit" :disabled="!heroYamlText.trim()">Import</button>
        </div>
      </form>
    </div>
    <div class="tag-holder">
      <Hero
        v-for="(entry, index) in heroEntries"
        :id="heroId(entry.characterName)"
        :key="entry.name"
        :shard="entry.shard"
        draggable="true"
        @dragstart="handleTopLevelDragStart($event, 'hero', index, onHeroDrag)"
        @dragend="clearTopLevelDrag"
        @dragover.prevent
        @drop="handleTopLevelDrop('hero', index, onHeroDrop)"
        @delete="deleteHero(entry.name)"
      />
    </div>
      </div>
      <RollHistory />
    </div>
  </main>
</template>

<style>
main {
  height: 100vh;
  overflow: hidden;

  display: flex;
  flex-direction: column;
}

.update-warning {
  z-index: 110;
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.65rem 1rem;
  background: #7a2300;
  color: white;
  text-align: center;
}

.update-warning button {
  flex: 0 0 auto;
  border: 2px solid white;
  border-radius: 0.4rem;
  padding: 0.35rem 0.75rem;
  background: white;
  color: #4d1600;
  font: inherit;
  font-weight: bold;
  cursor: pointer;
}

.app-body {
  flex: 1 1 auto;
  min-height: 0;

  display: flex;
  align-items: flex-start;
  overflow: hidden;
}

.app-content {
  flex: 1 1 auto;
  min-width: 0;
  height: 100%;
  overflow-y: auto;
  scrollbar-gutter: stable;
}

.character-name-row {
  display: flex;
  gap: 0.5rem;
}

.character-name-row input {
  flex: 1 1 auto;
}

@media (max-width: 32rem) {
  .character-name-row {
    flex-direction: column;
  }
}

@media (max-width: 48rem) {
  main {
    height: auto;
    overflow: visible;
  }

  .app-body {
    flex-direction: column;
    overflow: visible;
  }

  .app-content {
    width: 100%;
    height: auto;
    overflow: visible;
  }
}
</style>
