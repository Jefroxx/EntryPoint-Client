const SWATCHES = ['#532c2e', '#1e423f', '#a97954', '#34000b', '#855e56', '#2f5d58', '#c29b87', '#6b4a3a', '#4a1f24', '#5b6f55']

// A stable colour per category name, so a category keeps the same swatch everywhere
// it appears (Categories tab, catalog table) and as the list changes.
export function subjectSwatch(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return SWATCHES[Math.abs(hash) % SWATCHES.length]!
}
