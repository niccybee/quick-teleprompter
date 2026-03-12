export function normalizeGoogleDocUrl(input: string): string {
  let url: URL

  try {
    url = new URL(input)
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Invalid URL' })
  }

  if (!url.hostname.includes('docs.google.com')) {
    throw createError({ statusCode: 400, statusMessage: 'URL must be from docs.google.com' })
  }

  const match = url.pathname.match(/\/document\/d\/([a-zA-Z0-9_-]+)/)
  if (!match) {
    throw createError({ statusCode: 400, statusMessage: 'Google Doc ID not found in URL' })
  }

  const docId = match[1]
  return `https://docs.google.com/document/d/${docId}/export?format=txt`
}

export async function importGoogleDocText(inputUrl: string): Promise<string> {
  const exportUrl = normalizeGoogleDocUrl(inputUrl)
  const response = await fetch(exportUrl, {
    headers: {
      'User-Agent': 'teleprompter-import/1.0'
    }
  })

  if (!response.ok) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unable to import Google Doc. Ensure it is shared publicly.'
    })
  }

  const text = await response.text()
  if (!text.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'Google Doc is empty' })
  }

  return text
}
