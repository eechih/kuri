function isValidHttpUrl(v: string) {
  let url
  try {
    url = new URL(v)
  } catch (_) {
    return false
  }
  return url.protocol === 'http:' || url.protocol === 'https:'
}

export { isValidHttpUrl }
