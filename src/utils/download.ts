export function downloadBlob(blob: Blob, filename: string | undefined, fallbackFilename: string) {
  const rawFilename = filename || fallbackFilename
  const filenameWithoutControlCharacters = [...rawFilename]
    .map((character) => (character.charCodeAt(0) < 32 ? '_' : character))
    .join('')
  const safeFilename = filenameWithoutControlCharacters.replace(/[\\/:*?"<>|]/g, '_')
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = objectUrl
  link.download = safeFilename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
