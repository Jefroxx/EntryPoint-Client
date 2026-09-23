const SWATCHES = ['#9a5323', '#3d6b8f', '#3f7d54', '#a5751f', '#7a3f18', '#6b5b95', '#c07a3e', '#4a7c74', '#b0523f', '#5c7a3d']

// A stable colour per category name, so a category keeps the same swatch everywhere
// it appears (Categories tab, catalog table) and as the list changes.
export function subjectSwatch(name: string): string {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return SWATCHES[Math.abs(hash) % SWATCHES.length]!
}
