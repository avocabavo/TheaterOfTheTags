const fullHexColorPattern = /^#[0-9a-f]{6}$/i
const shortHexColorPattern = /^#[0-9a-f]{3}$/i

function toFullHexColor(value: unknown, fallback: string) {
  const color = normalizeCssColor(value, fallback)

  if (fullHexColorPattern.test(color)) {
    return color.toLowerCase()
  }

  if (shortHexColorPattern.test(color)) {
    const [, r, g, b] = color
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  if (color !== fallback) {
    return toFullHexColor(fallback, '#000')
  }

  return '#000000'
}

export function normalizeCssColor(value: unknown, fallback: string) {
  if (typeof value !== 'string' || !value.trim()) return fallback
  return value.trim()
}

export function toColorInputValue(value: unknown, fallback: string) {
  const color = normalizeCssColor(value, fallback)

  if (fullHexColorPattern.test(color)) {
    return color.toLowerCase()
  }

  if (shortHexColorPattern.test(color)) {
    const [, r, g, b] = color
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase()
  }

  return toColorInputValue(fallback, '#000')
}

export function readableTextColorForBackground(value: unknown, fallback: string) {
  const color = toFullHexColor(value, fallback)
  const red = Number.parseInt(color.slice(1, 3), 16)
  const green = Number.parseInt(color.slice(3, 5), 16)
  const blue = Number.parseInt(color.slice(5, 7), 16)
  const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255

  return luminance > 0.55 ? '#111' : '#fff'
}
