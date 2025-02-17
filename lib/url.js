export class RouterURL {
  #url

  constructor(url, opts = {}) {
    this.#url = new URL(url)
    this.mode = opts.mode ?? 'web'
    this.base = opts.base ?? ''
  }

  set url (val) {
    this.#url = new URL(val)
  }

  get url () {
    return this.#url.href
  }

  get path () {
    return (this.mode === 'hash' && this.#url.hash)
      ? this.#url.hash.slice(1).split("?").shift()
      : this.#url.pathname.replace(this.base, '')
  }

  get query () {
    return Object.fromEntries(
      new URLSearchParams(
        this.#url.href.indexOf('?') > -1 ? this.#url.href.split('?').pop() : ''
      )
    )
  }

  get search () {
    return this.#url.search;
  }

  resolve (path, params, replace = false) {
    const l = this.#url.origin + this.base + (this.mode === 'hash' ? '#' : '') + path
    const r = replace
      ? new URLSearchParams(params).toString()
      : new URLSearchParams({ ...this.query, ...params }).toString()
    this.url = l + (r ? '?' + r : '')
    return this
  }
}
