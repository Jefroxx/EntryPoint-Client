import { areaService, type AreaRecord, type FundSourceRecord } from '~/services/areaService'

let areasRequest: Promise<void> | null = null
let fundsRequest: Promise<void> | null = null

/** The areas of the library, fetched once and kept for every screen (names for `LIBRARY_AREAS`, the Add Book dropdown). */
export function useLibraryAreas() {
	const areas = useState<AreaRecord[]>('library-areas', () => [])

	async function refresh() {
		const { areas: list } = await areaService.fetchAreas()
		areas.value = list
		setLibraryAreas(list)
	}

	if (import.meta.client && !areas.value.length && !areasRequest) {
		areasRequest = refresh().catch(() => {}).finally(() => { areasRequest = null })
	}

	return { areas, refresh }
}

/** The sources of funds, fetched once: they fill the "Source of fund" suggestions. */
export function useFundSources() {
	const sources = useState<FundSourceRecord[]>('fund-sources', () => [])

	async function refresh() {
		const { sources: list } = await areaService.fetchFundSources()
		sources.value = list
		setFundSources(list.map((s) => s.name))
	}

	if (import.meta.client && !sources.value.length && !fundsRequest) {
		fundsRequest = refresh().catch(() => {}).finally(() => { fundsRequest = null })
	}

	return { sources, refresh }
}
