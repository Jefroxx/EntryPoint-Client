import { librarianService } from '~/services/librarianService'

/**
 * Whether the library session is open: from opening the scan station until a librarian presses its End session.
 * It is kept on the server, so it stays "running" after the station's tab is closed and shows the same on every
 * computer (it says the library is open). Checked every 30 seconds, and straight away when the station in this
 * browser opens or ends (it says so over the station channel).
 */
export function useStationSession() {
	const { data, execute } = useLiveAsyncData('station-session', () => librarianService.fetchStationSession(), { lazy: true, pollMs: 30_000 })

	useStationChannel((message) => {
		if (message.type === 'open' || message.type === 'closed') void execute()
	})

	const session = computed(() => data.value?.session ?? null)
	const running = computed(() => !!session.value)
	// "since 8:02 AM", for the button.
	const since = computed(() => (session.value ? formatTime(new Date(session.value.startedAt)) : ''))

	return { session, running, since, refresh: execute }
}
