export function build (path) {
  if (path === '*') {
    return /^.*$/
  }
  if (path.indexOf(':') === -1) {
    return path
  }
  const pattern = path.split('/').map(e => {
    if (!e.startsWith(':')) {
      return e
    }

    let field = e.substr(1)
    let fieldPattern = '[^/]+'
    const ef = field.match(/\((.+?)\)/)

    if (ef) {
      field = field.substr(0, field.indexOf('('))
      fieldPattern = ef[1]
    }

    return `(?<${field}>${fieldPattern})`
  }).join('/')
  return new RegExp(`^${pattern}$`)
}

export function match (path, pattern) {
  if (pattern instanceof RegExp) {
    const found = path.match(pattern)
    if (!found) return false
    return { ...found.groups }
  }
  return path === pattern
}
