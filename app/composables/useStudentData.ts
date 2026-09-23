/**
 * A student page's data: fetched lazily (the page paints its skeleton first), kept current in the
 * background (a librarian accepting a reservation shows up without a refresh), and re-fetched
 * straight away whenever something elsewhere changes it (a reservation made from the cart drawer,
 * a return reported from a sheet...).
 */
export function useStudentData<T>(key: string, fetcher: () => Promise<T>) {
  const { dataVersion } = useStudent()
  const result = useLiveAsyncData<T>(key, fetcher, { lazy: true, pollMs: 20_000 })

  watch(dataVersion, () => { void result.refresh() })

  return result
}
