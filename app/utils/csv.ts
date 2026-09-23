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
