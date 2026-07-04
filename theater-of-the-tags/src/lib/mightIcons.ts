import adventureBlack from '../assets/adventure-black.svg'
import adventureWhite from '../assets/adventure-white.svg'
import greatnessBlack from '../assets/greatness-black.svg'
import greatnessWhite from '../assets/greatness-white.svg'
import originBlack from '../assets/origin-black.svg'
import originWhite from '../assets/origin-white.svg'
import type { Might } from './schema'

const mightIcons: Record<Might, string> = {
  origin: originBlack,
  adventure: adventureBlack,
  greatness: greatnessBlack,
}

const whiteMightIcons: Record<Might, string> = {
  origin: originWhite,
  adventure: adventureWhite,
  greatness: greatnessWhite,
}

const mightColors: Record<Might, string> = {
  origin: '#88c29e',
  adventure: '#c29188',
  greatness: '#8f80bd',
}

export function mightIcon(might: Might) {
  return mightIcons[might]
}

export function whiteMightIcon(might: Might) {
  return whiteMightIcons[might]
}

export function mightColor(might: Might) {
  return mightColors[might]
}
