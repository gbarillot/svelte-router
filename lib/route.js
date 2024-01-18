import { writable } from 'svelte/store'
import * as patterns from './pattern'
import { RouterURL } from './url'

const config = {
  base: '',
  mode: ''
}

const state = writable(location.href)

let allRoutes = []

export const router = writable({
  component: '',
  name: '',
  path: '',
  fullPath: '',
  query: {},
  params: {}
})

export function onRouteChange(callback) {
  let previousPath = null;

  return router.subscribe(currentValue => {
    previousPath = currentValue.path
    const currentPath = currentValue.path;
    previousPath = currentPath;
    let matchedRoute = null;

    for (const route of allRoutes) {
      const found = patterns.match(currentPath, route.pattern);
      if (found) {
        matchedRoute = {
          component: route.component,
          path: currentPath,
          query: currentValue.query,
          params: found === true ? {} : found
        };
        break;
      }
    }

    const nextPath = !matchedRoute ? null : matchedRoute.path

    if (typeof previousPath === 'function') {
      previousPath = null;
    } 

    callback(previousPath, nextPath);
    previousPath = currentPath;
  });
}

router.push = (path, options = {}) => {
  const q = new URLSearchParams(options.query).toString();

  if (!path.startsWith(location.origin)) {
    if (config.mode === 'hash') {
      path = location.origin + (config.base || '/') + '#' + path
    } else {
      path = location.origin + config.base + path
    }
  }

  const fullPath = q === '' ? path : `${path}?${q}`
  history[options.replace ? 'replaceState' : 'pushState']({}, '', fullPath)
  state.set(fullPath)    
}

router.goto = (name, options = {}) => {
  router.push(getLink(name, options), { replace: false })
}

router.replace = (path) => {
  router.push(path, { replace: true })
}

export function createRouter({ routes, base, mode }) {
  allRoutes = routes;
  if (mode !== 'hash' && base && base.endsWith('/')) base = base.slice(0, -1)
  config.base = base ?? ''
  config.mode = mode ?? 'web'

  for (const route of routes) {
    route.pattern = patterns.build(route.path)
  }

  state.subscribe(href => {
    const url = new RouterURL(href, config)
    const path = url.path
    const query = url.query
    const search = url.search 
    const fullPath = `${path}${search}`

    let component = ''
    let name = ''
    let params = {}

    for (const route of routes) {
      const found = patterns.match(path, route.pattern)
      
      if (found) {
        name = route.name;
        component = route.component
        params = found === true ? {} : found
        break
      }
    }

    router.set({ component, name, path, query, params, search, fullPath })
  })

  window.addEventListener('popstate', () => state.set(location.href))

  return router
}

function getLink(name, args = {}) {
  function replacePlaceholders(obj, pattern) {
    return pattern.replace(/:\w+/g, function (match) {
      const key = match.substring(1); 
      return obj.hasOwnProperty(key) ? obj[key] : match;
    })
  }

  let pathWithParams = args['path']
  const targetRoute = allRoutes.find(route => route.name === name);
  if (targetRoute) {
    pathWithParams = args['params'] === undefined ? targetRoute.path : replacePlaceholders(args['params'], targetRoute.path);
  } else {
    console.log(`route called using name "${name}" cannot be found`)
  }    

  return pathWithParams;
}

export function link(el, args = {}) {
  let pathWithParams = args['path']
  if (args['to']) {
    pathWithParams = getLink(args['to'], args)   
  } 
  if (args['query']) {
    pathWithParams = `${pathWithParams}?${args['query']}` 
  }

  el.href = `${config.base}${pathWithParams}`;

  function go(e) {
    e.preventDefault()
    router.push(el.href, { replace: !!el.attributes.replace })
  }
  el.addEventListener('click', go)
  return {
    destroy() {
      el.removeEventListener('click', go)
    }
  }  
}

export const urlQuery = (path, query = {}) =>
  new RouterURL(location.href, config).resolve(path, query).url
