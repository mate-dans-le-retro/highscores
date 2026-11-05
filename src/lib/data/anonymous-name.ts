/**
 * Pure generator of fun anonymous nicknames for scores kept off the public
 * screen. Seeded by the normalized player name and the game id, so the same
 * player always gets the same nickname on a given game. Claude can reuse this
 * module on the server (view or server function) without dragging React.
 */

export type Gender = 'm' | 'f'

export interface NamedCharacter {
  name: string
  gender: Gender
}

interface GenderedWord {
  m: string
  f: string
}

/** Long pop-culture fallback when a game has no character list of its own. */
export const FALLBACK_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Mario', gender: 'm' },
  { name: 'Luigi', gender: 'm' },
  { name: 'Peach', gender: 'f' },
  { name: 'Daisy', gender: 'f' },
  { name: 'Yoshi', gender: 'm' },
  { name: 'Toad', gender: 'm' },
  { name: 'Bowser', gender: 'm' },
  { name: 'Wario', gender: 'm' },
  { name: 'Waluigi', gender: 'm' },
  { name: 'Rosalina', gender: 'f' },
  { name: 'Link', gender: 'm' },
  { name: 'Zelda', gender: 'f' },
  { name: 'Sheik', gender: 'f' },
  { name: 'Ganon', gender: 'm' },
  { name: 'Samus', gender: 'f' },
  { name: 'Ridley', gender: 'm' },
  { name: 'Kirby', gender: 'm' },
  { name: 'Meta Knight', gender: 'm' },
  { name: 'King Dedede', gender: 'm' },
  { name: 'Fox', gender: 'm' },
  { name: 'Falco', gender: 'm' },
  { name: 'Peppy', gender: 'm' },
  { name: 'Slippy', gender: 'm' },
  { name: 'Pikachu', gender: 'm' },
  { name: 'Évoli', gender: 'm' },
  { name: 'Mew', gender: 'm' },
  { name: 'Sonic', gender: 'm' },
  { name: 'Tails', gender: 'm' },
  { name: 'Knuckles', gender: 'm' },
  { name: 'Amy', gender: 'f' },
  { name: 'Shadow', gender: 'm' },
  { name: 'Rouge', gender: 'f' },
  { name: 'Pac-Man', gender: 'm' },
  { name: 'Ms. Pac-Man', gender: 'f' },
  { name: 'Blinky', gender: 'm' },
  { name: 'Donkey Kong', gender: 'm' },
  { name: 'Diddy Kong', gender: 'm' },
  { name: 'Dixie Kong', gender: 'f' },
  { name: 'Crash', gender: 'm' },
  { name: 'Coco', gender: 'f' },
  { name: 'Spyro', gender: 'm' },
  { name: 'Sparx', gender: 'm' },
  { name: 'Lara', gender: 'f' },
  { name: 'Solid Snake', gender: 'm' },
  { name: 'Otacon', gender: 'm' },
  { name: 'Cloud', gender: 'm' },
  { name: 'Tifa', gender: 'f' },
  { name: 'Aerith', gender: 'f' },
  { name: 'Sephiroth', gender: 'm' },
  { name: 'Nathan Drake', gender: 'm' },
  { name: 'Elena', gender: 'f' },
  { name: 'Kratos', gender: 'm' },
  { name: 'Atreus', gender: 'm' },
  { name: 'Aloy', gender: 'f' },
  { name: 'Ellie', gender: 'f' },
  { name: 'Joel', gender: 'm' },
  { name: 'Geralt', gender: 'm' },
  { name: 'Ciri', gender: 'f' },
  { name: 'Yennefer', gender: 'f' },
  { name: 'Triss', gender: 'f' },
  { name: 'Master Chief', gender: 'm' },
  { name: 'Cortana', gender: 'f' },
  { name: 'Gordon', gender: 'm' },
  { name: 'Alyx', gender: 'f' },
  { name: 'Doomguy', gender: 'm' },
  { name: 'Bomberman', gender: 'm' },
  { name: 'Mega Man', gender: 'm' },
  { name: 'Roll', gender: 'f' },
  { name: 'Ryu', gender: 'm' },
  { name: 'Chun-Li', gender: 'f' },
  { name: 'Ken', gender: 'm' },
  { name: 'Cammy', gender: 'f' },
  { name: 'Jin', gender: 'm' },
  { name: 'Kazuya', gender: 'm' },
  { name: 'Nina', gender: 'f' },
  { name: 'Scorpion', gender: 'm' },
  { name: 'Sub-Zero', gender: 'm' },
  { name: 'Kitana', gender: 'f' },
  { name: 'Rayman', gender: 'm' },
  { name: 'Globox', gender: 'm' },
  { name: 'Banjo', gender: 'm' },
  { name: 'Kazooie', gender: 'f' },
  { name: 'Conker', gender: 'm' },
  { name: 'Earthworm Jim', gender: 'm' },
  { name: 'Abe', gender: 'm' },
  { name: 'Jill', gender: 'f' },
  { name: 'Leon', gender: 'm' },
]

/** Tetris-flavoured cast when the game provides no override. */
export const TETRIS_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Tetri', gender: 'm' },
  { name: 'I-Tetromino', gender: 'm' },
  { name: 'O-Tetromino', gender: 'm' },
  { name: 'T-Tetromino', gender: 'm' },
  { name: 'L-Tetromino', gender: 'm' },
  { name: 'J-Tetromino', gender: 'm' },
  { name: 'S-Tetromino', gender: 'm' },
  { name: 'Z-Tetromino', gender: 'm' },
  { name: 'Line Clear', gender: 'f' },
  { name: 'Hard Drop', gender: 'm' },
]

export const DUCK_HUNT_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Duck', gender: 'm' },
  { name: 'Dog', gender: 'm' },
  { name: 'Zapper', gender: 'm' },
  { name: 'Clay Pigeon', gender: 'm' },
  { name: 'Flying Duck', gender: 'f' },
]

export const MARIO_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Mario', gender: 'm' },
  { name: 'Luigi', gender: 'm' },
  { name: 'Peach', gender: 'f' },
  { name: 'Toad', gender: 'm' },
  { name: 'Bowser', gender: 'm' },
  { name: 'Yoshi', gender: 'm' },
  { name: 'Goomba', gender: 'm' },
  { name: 'Koopa', gender: 'm' },
  { name: 'Boos', gender: 'm' },
  { name: 'Daisy', gender: 'f' },
]

export const GUITAR_HERO_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Axel Steel', gender: 'm' },
  { name: 'Judy Nails', gender: 'f' },
  { name: 'Johnny Napalm', gender: 'm' },
  { name: 'Pandora', gender: 'f' },
  { name: 'Lars Ümlaüt', gender: 'm' },
  { name: 'Midori', gender: 'f' },
  { name: 'Cliff Burton', gender: 'm' },
  { name: 'Eddie', gender: 'm' },
]

export const PAC_MAN_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Pac-Man', gender: 'm' },
  { name: 'Ms. Pac-Man', gender: 'f' },
  { name: 'Blinky', gender: 'm' },
  { name: 'Pinky', gender: 'f' },
  { name: 'Inky', gender: 'm' },
  { name: 'Clyde', gender: 'm' },
  { name: 'Sue', gender: 'f' },
]

export const MARIO_KART_CHARACTERS: ReadonlyArray<NamedCharacter> = [
  { name: 'Mario', gender: 'm' },
  { name: 'Luigi', gender: 'm' },
  { name: 'Peach', gender: 'f' },
  { name: 'Daisy', gender: 'f' },
  { name: 'Yoshi', gender: 'm' },
  { name: 'Toad', gender: 'm' },
  { name: 'Bowser', gender: 'm' },
  { name: 'Donkey Kong', gender: 'm' },
  { name: 'Wario', gender: 'm' },
  { name: 'Waluigi', gender: 'm' },
  { name: 'Rosalina', gender: 'f' },
  { name: 'Metal Mario', gender: 'm' },
]

/** Default cast per game id; missing ids fall back to FALLBACK_CHARACTERS. */
export const CHARACTERS_BY_GAME_ID: Readonly<
  Record<string, ReadonlyArray<NamedCharacter>>
> = {
  'g-tetris': TETRIS_CHARACTERS,
  'g-duck-hunt': DUCK_HUNT_CHARACTERS,
  'g-super-mario-bros': MARIO_CHARACTERS,
  'g-guitar-hero': GUITAR_HERO_CHARACTERS,
  'g-pac-man': PAC_MAN_CHARACTERS,
  'g-mario-kart': MARIO_KART_CHARACTERS,
}

export const QUALIFIERS: ReadonlyArray<GenderedWord> = [
  { m: 'anonyme', f: 'anonyme' },
  { m: 'masqué', f: 'masquée' },
  { m: 'incognito', f: 'incognito' },
  { m: 'discret', f: 'discrète' },
  { m: 'mystère', f: 'mystère' },
  { m: 'timide', f: 'timide' },
  { m: 'camouflé', f: 'camouflée' },
  { m: 'fantôme', f: 'fantôme' },
  { m: 'secret', f: 'secrète' },
  { m: 'furtif', f: 'furtive' },
  { m: 'invisible', f: 'invisible' },
  { m: 'sous couverture', f: 'sous couverture' },
  { m: 'sans visage', f: 'sans visage' },
  { m: 'énigmatique', f: 'énigmatique' },
  { m: 'éphémère', f: 'éphémère' },
  { m: 'clandestin', f: 'clandestine' },
  { m: 'voilé', f: 'voilée' },
  { m: 'nocturne', f: 'nocturne' },
  { m: 'silencieux', f: 'silencieuse' },
  { m: 'inconnu', f: 'inconnue' },
]

export const FLOURISHES: ReadonlyArray<GenderedWord> = [
  { m: 'en planque', f: 'en planque' },
  { m: 'sous cape', f: 'sous cape' },
  { m: 'sans nom', f: 'sans nom' },
  { m: 'en vadrouille', f: 'en vadrouille' },
  { m: 'en roue libre', f: 'en roue libre' },
  { m: 'dans l’ombre', f: 'dans l’ombre' },
  { m: 'hors radar', f: 'hors radar' },
  { m: 'en mode fantôme', f: 'en mode fantôme' },
  { m: 'au fond du score', f: 'au fond du score' },
  { m: 'derrière l’écran', f: 'derrière l’écran' },
  { m: 'en mission secrète', f: 'en mission secrète' },
  { m: 'à découvert… presque', f: 'à découvert… presque' },
]

export interface AnonymousNameInput {
  playerName: string
  gameId: string
  /** Admin-configurable cast for the game; falls back to the built-in lists. */
  characters?: ReadonlyArray<NamedCharacter> | null
}

/** Lowercase, strip accents, collapse spaces: the seed of the nickname. */
export function normalizePlayerName(name: string) {
  return name
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/** Stable 32-bit hash; same string always yields the same value. */
export function hashSeed(value: string) {
  let hash = 2166136261
  for (const char of value) {
    hash ^= char.charCodeAt(0)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

function pick<T>(list: ReadonlyArray<T>, seed: number, salt: number): T {
  const item = list[(seed + salt) % list.length]
  if (item === undefined) throw new Error('Anonymous name list is empty')
  return item
}

function agree(word: GenderedWord, gender: Gender) {
  return gender === 'f' ? word.f : word.m
}

function resolveCharacters(
  gameId: string,
  characters?: ReadonlyArray<NamedCharacter> | null,
): ReadonlyArray<NamedCharacter> {
  if (characters && characters.length > 0) return characters
  return CHARACTERS_BY_GAME_ID[gameId] ?? FALLBACK_CHARACTERS
}

/**
 * Builds one nickname per (normalized player name, game). Shape:
 * "Un Mario anonyme", "Une Samus masquée en planque".
 */
export function anonymousName({
  playerName,
  gameId,
  characters,
}: AnonymousNameInput): string {
  const seed = hashSeed(`${normalizePlayerName(playerName)}\0${gameId}`)
  const cast = resolveCharacters(gameId, characters)
  const character = pick(cast, seed, 0)
  const qualifier = agree(pick(QUALIFIERS, seed, 97), character.gender)
  const article = character.gender === 'f' ? 'Une' : 'Un'
  // Roughly half the nicknames get a flourish, decided by a bit of the seed.
  const withFlourish = (seed & 0b1000) !== 0
  if (!withFlourish) return `${article} ${character.name} ${qualifier}`
  const flourish = agree(pick(FLOURISHES, seed, 193), character.gender)
  return `${article} ${character.name} ${qualifier} ${flourish}`
}
