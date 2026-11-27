import type { ImportBookRow } from '~/services/librarianService'

/**
 * The columns an accession record may have, by the names librarians give them. The library's own sheet ("Number",
 * "Class", "TITLE OF BOOK", "Cost Price"...) and EntryPoint's Excel export ("Accession No.", "Call No.", "Area"...)
 * both read without any setup. Only a title column is needed.
 */
const COLUMNS: Record<Exclude<keyof ImportBookRow, 'row' | 'dateAutofilled'>, { label: string; match: RegExp }> = {
  accessionNumber: { label: 'Accession number', match: /^(number|no\.?|acc(ession)?\.?( ?no\.?| ?number)?)$/ },
  dateReceived: { label: 'Date received', match: /^(date ?received|date acquired|received)$/ },
  callNumber: { label: 'Class / call number', match: /^(class|call ?no\.?|call ?number|classification)$/ },
  area: { label: 'Area', match: /^area( of (the )?library)?$/ },
  authors: { label: 'Author', match: /^authors?|^author\(s\)$/ },
  title: { label: 'Title', match: /^title( of (the )?book)?$/ },
  edition: { label: 'Edition', match: /^edition$/ },
  volume: { label: 'Volume', match: /^vol(ume)?s?\.?$/ },
  pages: { label: 'Pages', match: /^(pages|page count|no\.? of pages)$/ },
  sourceOfFund: { label: 'Source of fund', match: /^(source of funds?|fund)$/ },
  cost: { label: 'Cost', match: /^(cost( price)?|cost \(php\)|price|amount)$/ },
  publisher: { label: 'Publisher', match: /^publisher$/ },
  year: { label: 'Year', match: /^(year|year published|publication year|copyright)$/ },
  remarks: { label: 'Remarks', match: /^remarks?$/ },
  isbn: { label: 'ISBN', match: /^isbn$/ },
}

export interface AccessionSheet {
  fileName: string
  sheetName: string
  rows: ImportBookRow[]
  /** The columns that were recognised, by their label here, in the sheet's order. */
  columns: string[]
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function cellText(value: any): string {
  if (value === null || value === undefined) return ''
  // A real Excel date: sent as 2026-03-19, so it isn't read as month/day the wrong way round.
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'object') {
    if (Array.isArray(value.richText)) return value.richText.map((part: { text: string }) => part.text).join('')
    if ('result' in value) return cellText(value.result)
    if ('text' in value) return String(value.text)
    return ''
  }
  return String(value)
}

/**
 * Reads the first sheet of an accession record. The header is the first of the top ten rows that names a title
 * column. Also notices dates Excel made up: dragging "03-12,05" down a column counts it up ("03-12,06",
 * "03-12,07"...), so a date that is exactly the one above it plus one is marked, and the server won't believe it.
 */
export async function readAccessionRecord(file: File): Promise<AccessionSheet> {
  const { default: ExcelJS } = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.load(await file.arrayBuffer())

  const sheet = workbook.worksheets.find((ws) => ws.rowCount > 0)
  if (!sheet) throw new Error('This file has no sheet with anything in it.')

  let headerRow = 0
  let columns: Partial<Record<keyof typeof COLUMNS, number>> = {}
  for (let r = 1; r <= Math.min(10, sheet.rowCount) && !headerRow; r++) {
    const found: typeof columns = {}
    sheet.getRow(r).eachCell((cell, col) => {
      const name = cellText(cell.value).trim().toLowerCase().replace(/\s+/g, ' ')
      for (const [key, { match }] of Object.entries(COLUMNS) as [keyof typeof COLUMNS, { match: RegExp }][]) {
        if (found[key] === undefined && match.test(name)) found[key] = col
      }
    })
    if (found.title !== undefined) {
      headerRow = r
      columns = found
    }
  }
  if (!headerRow) {
    throw new Error("Couldn't find a Title column in the first rows of the sheet. The first row should name the columns: Number, Title, Author, Class...")
  }

  const rows: ImportBookRow[] = []
  let previousDate = ''
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const excelRow = sheet.getRow(r)
    const row: ImportBookRow = { row: r }
    for (const [key, col] of Object.entries(columns) as [keyof typeof COLUMNS, number][]) {
      const text = cellText(excelRow.getCell(col).value).trim()
      if (text) row[key] = text
    }

    const date = row.dateReceived ?? ''
    const now = date.match(/^(.*?)(\d+)$/)
    const before = previousDate.match(/^(.*?)(\d+)$/)
    if (now && before && now[1] === before[1] && Number(now[2]) === Number(before[2]) + 1 && !/^\d{4}-\d\d-\d\d$/.test(date)) {
      row.dateAutofilled = true
    }
    if (date) previousDate = date

    rows.push(row)
  }

  const labels = (Object.entries(columns) as [keyof typeof COLUMNS, number][]).sort((a, b) => a[1] - b[1]).map(([key]) => COLUMNS[key].label)

  return { fileName: file.name, sheetName: sheet.name, rows, columns: labels }
}
