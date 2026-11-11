/**
 * What may be typed into a number box. A browser's own number box accepts `e`, `+`, `-` and any number of decimals
 * (it reads "1e3" as 1000), none of which mean anything for a page count or a price. These keep only what does, as it
 * is typed or pasted. Auto-imported, like utils/format.ts.
 */

/** Whole numbers: digits only, at most `maxLength` of them ("320"). */
export function digitsOnly(raw: string, maxLength = 9): string {
  return raw.replace(/\D/g, '').slice(0, maxLength)
}

/** Digits and at most one decimal point, with no more than `decimals` places after it ("1250.5", "0.99"). */
export function decimalOnly(raw: string, decimals = 2, maxWhole = 9): string {
  const [whole = '', ...rest] = raw.replace(/[^0-9.]/g, '').split('.')
  const kept = whole.slice(0, maxWhole)
  return rest.length ? `${kept}.${rest.join('').slice(0, decimals)}` : kept
}

/** How many decimal places a `step` allows: 0.01 -> 2, 0.5 -> 1, 1 or nothing -> 0 (a whole number). */
export function decimalsOfStep(step: number | string | undefined): number {
  if (step === undefined || step === 'any') return step === 'any' ? 2 : 0
  const text = String(step)
  return text.includes('.') ? text.split('.')[1]!.length : 0
}
