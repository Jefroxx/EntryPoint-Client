import { reactive } from 'vue'

/**
 * Area key -> its name, for every place that shows an area ("circulation" -> "Circulation"). These are the starting
 * areas until the librarian's own list arrives from the server (Library > Categories > Areas of the Library);
 * `useLibraryAreas` fills it in, and an unknown key shows as it is.
 */
export const LIBRARY_AREAS = reactive<Record<string, string>>({
	circulation: 'Circulation',
	filipiniana: 'Filipiniana',
	'general-reference': 'General Reference',
	reserved: 'Reserve',
	journal: 'Journal',
	thesis: 'Thesis and Dissertation',
	fiction: 'Fiction',
	dictionary: 'Dictionary',
	materials: 'Materials',
})

export function setLibraryAreas(areas: { key: string; name: string }[]) {
	if (!areas.length) return
	for (const key of Object.keys(LIBRARY_AREAS)) delete LIBRARY_AREAS[key]
	for (const area of areas) LIBRARY_AREAS[area.key] = area.name
}
