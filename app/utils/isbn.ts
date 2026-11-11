/**
 * ISBNs, as they come off a book's barcode or from a keyboard. The server checks them again (and converts an ISBN-10
 * to its ISBN-13), but a scanner needs the same test on the spot: the back of a book also carries a small price
 * barcode and other numbers, and only a real ISBN should be acted on.
 */

/** Digits (and a final X) of whatever was typed or scanned, with hyphens and spaces removed. */
export function isbnDigits(raw: string): string {
  return raw.replace(/[^0-9Xx]/g, '').toUpperCase()
}

function isbn13CheckDigit(first12: string): number {
  let sum = 0
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * (i % 2 === 0 ? 1 : 3)
  return (10 - (sum % 10)) % 10
}

/**
 * What may be typed in an ISBN box: digits, hyphens and spaces, plus an X, but only as the very last character (the
 * check digit of an ISBN-10 can be 10, written X). Anything else is dropped as it is typed or pasted, and no more
 * than 13 digits are kept.
 */
export function sanitizeIsbnInput(raw: string): string {
  const cleaned = raw.toUpperCase().replace(/[^0-9X\- ]/g, '').replace(/X(?=.*[0-9X])/g, '')

  let count = 0
  let out = ''
  for (const char of cleaned) {
    if (char !== '-' && char !== ' ') {
      if (count >= 13) break
      count++
    }
    out += char
  }
  return out
}

/** The ISBN-13 for a valid ISBN-10 or ISBN-13 (correct check digit), otherwise null. */
export function normalizeIsbn(raw: string): string | null {
  const digits = isbnDigits(raw)

  if (/^\d{13}$/.test(digits)) {
    return isbn13CheckDigit(digits.slice(0, 12)) === Number(digits[12]) ? digits : null
  }

  if (/^\d{9}[\dX]$/.test(digits)) {
    let sum = 0
    for (let i = 0; i < 10; i++) sum += (digits[i] === 'X' ? 10 : Number(digits[i])) * (10 - i)
    if (sum % 11 !== 0) return null
    const core = `978${digits.slice(0, 9)}`
    return core + isbn13CheckDigit(core)
  }

  return null
}

/** A scanned barcode that is a book's ISBN: 13 digits starting 978 or 979 (the "Bookland" prefixes), check digit correct. */
export function isbnFromBarcode(code: string): string | null {
  const digits = code.trim()
  return /^97[89]\d{10}$/.test(digits) ? normalizeIsbn(digits) : null
}
