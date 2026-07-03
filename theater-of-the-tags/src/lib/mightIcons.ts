import adventureBlack from '../assets/adventure-black.svg'
import greatnessBlack from '../assets/greatness-black.svg'
import originBlack from '../assets/origin-black.svg'
import type { Might } from './schema'

const mightIcons: Record<Might, string> = {
  origin: originBlack,
  adventure: adventureBlack,
  greatness: greatnessBlack,
}

export function mightIcon(might: Might) {
  return mightIcons[might]
}
