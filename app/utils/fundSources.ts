import { reactive } from 'vue'

/**
 * The sources the "Source of fund" box suggests (it still takes anything typed). These are the starting three until the
 * librarian's own list arrives from the server (Library > Categories > Sources of Funds); `useFundSources` fills it in.
 */
export const FUND_SOURCES = reactive<string[]>(['Donated', 'Library budget', 'Student project'])

export function setFundSources(names: string[]) {
	if (names.length) FUND_SOURCES.splice(0, FUND_SOURCES.length, ...names)
}

/** A donated book cost the library nothing, so its cost is 0 and isn't asked for ("Donation" is the older wording). */
export function isDonatedFund(source: string | null | undefined): boolean {
  // Any wording that means "given to the library": donation, donated, "Donated by the class of 2025", donor...
  return /donat|donor/i.test(source ?? '')
}
