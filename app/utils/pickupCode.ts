/**
 * Reading a reservation pickup slip's code (R-000123) out of whatever a scanner hands over.
 *
 * A slip's barcode is exactly its code, but what comes back from a reader isn't always only that: some handheld
 * scanners and decoders add a symbology prefix ("]C0"), an invisible group separator, a space or a trailing Enter.
 * Requiring an exact "R-" + digits turned real slips away as "not a reservation slip", so the code is found
 * inside the read instead, as long as it stands on its own (not glued to other letters or digits).
 */
const SLIP = /(?:^|[^A-Z0-9])(R-0*(\d{1,9}))(?![0-9])/i

/** The reservation number on a slip ("R-000012" → "12"), or undefined when the read has no slip code in it. */
export function slipNumber(raw: string): string | undefined {
	return SLIP.exec(stripControl(raw))?.[2]
}

/** The slip code in its usual form ("r-12" → "R-000012"), or undefined. */
export function slipCode(raw: string): string | undefined {
	const n = slipNumber(raw)
	return n ? `R-${n.padStart(6, '0')}` : undefined
}

/** A read as the librarian can see it in a message: invisible characters shown as "·", and kept short. */
export function shownRead(raw: string): string {
	const visible = raw.replace(/[\u0000-\u001f\u007f]/g, '·').trim()
	return visible.length > 40 ? `${visible.slice(0, 40)}…` : visible
}

function stripControl(raw: string): string {
	// Invisible characters, then a symbology identifier ("]C0" = Code 128) some scanners put in front of every code.
	return raw.replace(/[\u0000-\u001f\u007f]/g, ' ').trim().replace(/^\][A-Za-z][0-9A-Za-z]/, '')
}
