export const EMOJI_POOL = [
  '😀','😎','🤩','🥳','🤣','😜','🤑','🥸','🤠','😤',
  '👾','🤖','👽','🎃','🧙','🦸','🥷','🧛','🧟','🤡',
  '🦁','🐯','🐻','🦊','🐺','🦝','🐸','🦄','🐲','🦋',
  '🦅','🦜','🐧','🦩','🦚','🦀','🐙','🦈','🐬','🦭',
  '🚀','⚡','🌟','💫','✨','🔥','💎','🏆','🎯','🎲',
  '🍀','🌈','🌀','💥','🎆','🎇','🧨','🎉','🎊','🎈',
]

export function randomEmoji(): string {
  return EMOJI_POOL[Math.floor(Math.random() * EMOJI_POOL.length)]
}

export function nameToHue(name: string): number {
  let hash = 0
  for (const ch of name) hash = ((hash << 5) - hash) + ch.charCodeAt(0)
  return Math.abs(hash) % 360
}
