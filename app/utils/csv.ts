function csvCell(value: string | number): string {
  let text = String(value)

  // Stop spreadsheet apps from running a cell that starts like a formula.
  if (/^[=+\-@]/.test(text) && Number.isNaN(Number(text))) text = `'${text}`

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

/** Downloads rows as a CSV file (client-side, no server round trip). */
export function downloadCsv(filename: string, rows: Array<Array<string | number>>) {
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}

/** Reads CSV text into rows of cells. Handles quoted cells (with commas, quotes and line breaks) and a leading BOM. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  const input = text.replace(/^\uFEFF/, '')

  for (let i = 0; i < input.length; i++) {
    const ch = input[i]!

    if (quoted) {
      if (ch === '"' && input[i + 1] === '"') { cell += '"'; i++ }
      else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') {
      quoted = true
    } else if (ch === ',') {
      row.push(cell); cell = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && input[i + 1] === '\n') i++
      row.push(cell); cell = ''
      rows.push(row); row = []
    } else {
      cell += ch
    }
  }

  if (cell !== '' || row.length) { row.push(cell); rows.push(row) }

  // A blank line is not a row.
  return rows.filter((r) => r.some((c) => c.trim() !== ''))
}
