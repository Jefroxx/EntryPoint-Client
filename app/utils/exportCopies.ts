import { LIBRARY_AREAS, librarianService, type CopyCatalogRow, type CopyStatus } from '~/services/librarianService'

type CopyFilters = Parameters<typeof librarianService.fetchCopies>[0]

const STATUS_LABEL: Record<CopyStatus, string> = {
	available: 'On the shelf',
	borrowed: 'Borrowed',
	damaged: 'Damaged',
	lost: 'Lost',
}

// The server returns at most 100 copies a request, so a long catalog is fetched a page at a time.
const PAGE_SIZE = 100

async function fetchAllCopies(filters: CopyFilters): Promise<CopyCatalogRow[]> {
	const rows: CopyCatalogRow[] = []
	let page = 1
	let lastPage = 1
	do {
		const result = await librarianService.fetchCopies({ ...filters, page, perPage: PAGE_SIZE })
		rows.push(...result.data)
		lastPage = result.last_page
		page++
	} while (page <= lastPage)
	return rows
}

const toNumber = (value: string | number | null | undefined) => (value === null || value === undefined || value === '' ? null : Number(value))

/**
 * Downloads the Book Catalog as an Excel file: one row per copy, for whatever the librarian's filters match.
 * The Excel library is loaded here, on click, so it stays out of the page until it is needed.
 */
export async function exportCopiesToExcel(filters: Omit<NonNullable<CopyFilters>, 'page' | 'perPage'>): Promise<{ message: string }> {
	const copies = await fetchAllCopies(filters)
	const { default: ExcelJS } = await import('exceljs')

	const workbook = new ExcelJS.Workbook()
	const sheet = workbook.addWorksheet('Book Catalog', { views: [{ state: 'frozen', xSplit: 1, ySplit: 1 }] })
	sheet.columns = [
		{ header: 'Accession No.', key: 'accession', width: 14 },
		{ header: 'Title', key: 'title', width: 44 },
		{ header: 'Author(s)', key: 'authors', width: 30 },
		{ header: 'Status', key: 'status', width: 14 },
		{ header: 'Category', key: 'category', width: 22 },
		{ header: 'Area', key: 'area', width: 16 },
		{ header: 'Call No.', key: 'callNumber', width: 16 },
		{ header: 'Shelf', key: 'shelf', width: 14 },
		{ header: 'ISBN', key: 'isbn', width: 18 },
		{ header: 'Barcode', key: 'barcode', width: 18 },
		{ header: 'Publisher', key: 'publisher', width: 26 },
		{ header: 'Year', key: 'year', width: 8 },
		{ header: 'Edition', key: 'edition', width: 12 },
		{ header: 'Volume', key: 'volume', width: 10 },
		{ header: 'Pages', key: 'pages', width: 8 },
		{ header: 'Source of Fund', key: 'fund', width: 20 },
		{ header: 'Cost (PHP)', key: 'cost', width: 12, style: { numFmt: '#,##0.00' } },
		{ header: 'Remarks', key: 'remarks', width: 30 },
	]

	for (const copy of copies) {
		const { book } = copy
		sheet.addRow({
			accession: copy.accessionNumber,
			title: book.title,
			authors: book.authors.join(', '),
			status: STATUS_LABEL[copy.status] ?? copy.status,
			category: book.subject?.name ?? '',
			area: book.areaOfLibrary ? LIBRARY_AREAS[book.areaOfLibrary] ?? book.areaOfLibrary : '',
			callNumber: book.callNumber,
			shelf: book.shelfLocation ?? '',
			isbn: book.isbn ?? '',
			barcode: copy.barcodeValue ?? '',
			publisher: book.publisher ?? '',
			year: book.publicationYear,
			edition: book.edition ?? '',
			volume: book.volume ?? '',
			pages: book.pages,
			fund: copy.sourceOfFund ?? book.sourceOfFund ?? '',
			cost: toNumber(copy.cost) ?? toNumber(book.cost),
			remarks: copy.remarks ?? '',
		})
	}

	sheet.getRow(1).font = { bold: true }
	sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columnCount } }

	const buffer = await workbook.xlsx.writeBuffer()
	const url = URL.createObjectURL(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }))
	const link = document.createElement('a')
	link.href = url
	link.download = `book-catalog-${new Date().toISOString().slice(0, 10)}.xlsx`
	link.click()
	URL.revokeObjectURL(url)

	return { message: `${copies.length} ${copies.length === 1 ? 'copy' : 'copies'} saved to ${link.download}.` }
}
