// Small helpers for the value/label choices the ministry pages share with their API schemas. No server code here.

export type Choice<V extends string = string> = { readonly value: V; readonly label: string }

/** The stored values of a choice list, as a tuple for z.enum(). */
export const choiceValues = <V extends string>(choices: readonly [Choice<V>, ...Choice<V>[]]) =>
  choices.map((c) => c.value) as [V, ...V[]]

/**
 * The label of a stored value. Values the list doesn't know (older rows typed by hand) are shown
 * readably instead of being hidden: 'in_use' → 'In use'.
 */
export function choiceLabel(choices: readonly Choice[], value: string | null | undefined): string | null {
  if (!value) return null
  const known = choices.find((c) => c.value === value)
  if (known) return known.label
  const words = value.replace(/[_-]+/g, ' ').trim().replace(/\s+/g, ' ').toLowerCase()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : null
}
