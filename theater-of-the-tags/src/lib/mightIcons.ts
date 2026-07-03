import adventureBlack from '../assets/adventure-black.svg'
import greatnessBlack from '../assets/greatness-black.svg'
import originBlack from '../assets/origin-black.svg'
import type { Might } from './schema'

const mightIcons: Record<Might, string> = {
  origin: originBlack,
  adventure: adventureBlack,
  greatness: greatnessBlack,
}

const mightColors: Record<Might, string> = {
  origin: '#88c29e',
  adventure: '#c29188',
  greatness: '#8f80bd',
}

export function mightIcon(might: Might) {
  return mightIcons[might]
}

export function mightColor(might: Might) {
  return mightColors[might]
}
