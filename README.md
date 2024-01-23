# Svelte Router

Yet another SPA vue-router inspired Svelte router
Based on the excellent https://github.com/shaunlee/svelte-router

## Installation

### npm

```bash
npm install @gbarillot/svelte-router
```

## Getting Started

```html
<script>
  import { createRouter, link, Link, View } from '@gbarillot/svelte-router'
  import Home from './Home.svelte'
  import User from './User.svelte'
  import NotFound from './NotFound.svelte'

  const routes = [
    { path: '/', component: Home },
    { path: '/users/:userId(\\d+)'component: User },
    { path: '/users/:userId/edit', name: 'edit_user', component: User },
    { path: '*', component: NotFound }
  ]

  const router = createRouter({ routes })
</script>

<Link path="/">Home</Link>
<Link path="/users/123">Someone</Link>
<Link path="/users/321" replace>Replace to someone else's page</Link>
<Link path="/not-exists">To page not exists</Link>
<Link to="edit_user" params={{userId: 123}}>Edit user</a>

<button type="button" on:click={() => router.push('/users/123')}>Click to someone's page</button>
<button type="button" on:click={() => router.goto('user_edit', {userId: 123}})}>Click to someone's page</button>
<button type="button" on:click={() => router.replace('/users/321')}>Click replace to someone else's page</button>

<a use:link href="/users/111">A link with action</a>
<a href="http://domain.com/outside.html">An external link with regular behavior</a>

<View></View>
```

## Base path

You can setup a base path to prefix all your route definitions:

``` 
import {
  createRouter
} from '@gbarillot/svelte-router'

const routes = [
  { path: '/', component: Home },
  { path: '/users/:userId/edit', name: 'edit_user', component: User },
  { path: '*', component: NotFound }
]

const router = createRouter({ base: 'fr/', routes: routes })
``` 

## Dynamic Route Matching with Params

Very often we will need to map routes with the given pattern to the same component. For example we may have a `User` component which should be rendered for all users but with different user IDs. In `@gbarillot/svelte-router` we can use a dynamic segment in the path to achieve that, we call that a param:

```javascript
import User from './User.svelte'

// these are passed to `createRouter`
const routes = [
  // dynamic segments start with a colon
  { path: '/users/:id', component: User },
]
```

Now URLs like `/users/johnny` and `/users/jolyne` will both map to the same route.

A param is denoted by a colon `:`. When a route is matched, the value of its params will be exposed as `$router.params`. Therefore, we can render the current user ID by updating User's template to this:

```html
<script>
  import { router } from '@gbarillot/svelte-router'
</script>

<div>User ID: {$router.params.id}</div>
```

The same:

```html
<script>
  export let id
</script>

<div>User ID: {id}</div>
```

You can have multiple params in the same route, and they will map to corresponding fields on `$router.params`. Examples:

| pattern | matched path | $router.params |
| --- | --- | --- |
| /users/:username | /users/eduardo | `{ username: 'eduardo' }` |
| /users/:username/posts/:postId | /users/eduardo/posts/123 | `{ username: 'eduardo', postId: '123' }` |

In addition to `$router.params`, the `$router` object also exposes other useful information such as `$router.query` (if there is a query in the URL), `$router.path`, etc.

## Named routes

Instead of using a path to target a route, you can also use its name and pass along its params:

``` 
<Link name="edit_user" params={{userId: 123}}>Edit user</a>
```

Will generate this 

``` 
<a href="/users/123/edit">Edit user</a>
```

You can also pass any HTML attribute, as well as data attributes:

``` 
<Link name="edit_user" params={{userId: 123}} attrs={{class: "card", title: "Edit user"}}>Edit user</Link>
<Link name="edit_user" params={{userId: 123}} data={{is: "edit-link", do: "edit"}}>Edit user</Link>
```

Will generate this 

``` 
<a href="/users/123/edit" class="card" title="Edit user">Edit user</a>
<a href="/users/123/edit" data-is="edit-link" data-do="edit">Edit user</a>
```

### Custom regex in params

When defining a param like `:userId`, we internally use the following regex `([^/]+)` (at least one character that isn't a slash `/`) to extract params from URLs.
This works well unless you need to differentiate two routes based on the param content. Imagine two routes `/:orderId` and `/:productName`, both would match the exact same URLs, so we need a way to differentiate them.
The easiest way would be to add a static section to the path that differentiates them:

```javascript
const routes = [
  // matches /o/3549
  { path: '/o/:orderId' },
  // matches /p/books
  { path: '/p/:productName' },
]
```

But in some scenarios we don't want to add that static section `/o/p`. However, `orderId` is always a number while `productName` can be anything, so we can specify a custom regex for a param in parentheses:

```javascript
const routes = [
  // /:orderId -> matches only numbers
  { path: '/:orderId(\\d+)' },
  // /:productName -> matches anything else
  { path: '/:productName' },
]
```

Now, going to `/25` will match `/:orderId` while going to anything else will match `/:productName`. The order of the `routes` array doesn't even matter!

> **TIP**
> Make sure to escape backslashes (`\`) like we did with `\d` (becomes `\\d`) to actually pass the backslash character in a string in JavaScript.

## Handling Not found / 404

There are 2 ways of doing this, depending on your requirements:

Using you own custom component

```javascript
import  NotFound from './shared/not_found.svelte'

const routes = [
  ...
  { path: '*', component: 'NotFound' },
]
```

Redirecting to some path

```javascript
onRouteChange((before, after) => {
  // after route === null means no match has been found
  if(!after) {
    window.location.href = '/404.html'
  }
})
```

## Programmatic Navigation

Aside from using `<Link>` to create anchor tags for declarative navigation, we can do this programmatically using the router's instance methods.

### Navigate to a different location

To navigate to a different URL, use `router.push`. This method pushes a new entry into the history stack, so when the user clicks the browser back button they will be taken to the previous URL.

This is the method called internally when you click a `<Link>`, so clicking `<Link href="...">` is the equivalent of calling `router.push(...)`.

| Declarative | Programmatic |
| --- | --- |
| `<Link href="...">` | `router.push(...)` |

The argument is a string path. Examples:

```javascript
router.push('/users/eduardo')
router.push('/users?page=2')
router.push('/users', { page: 2 })
```

Using `router.goto` lets you use named routes

```javascript 
router.goto('users')
router.goto('user_edit', params: {id: 1})
```

### Replace current location

It acts like `router.push`, the only difference is that it navigates without pushing a new history entry, as its name suggests - it replaces the current entry.

| Declarative | Programmatic |
| --- | --- |
| `<Link href="..." replace>` | `router.replace('...')` |

### Traverse history

This method takes a single integer as parameter that indicates by how many steps to go forward or go backward in the history stack, similar to `window.history.go(n)`. Examples:

```javascript
// go forward by one record, the same as router.forward()
router.go(1)

// go back by one record, the same as router.back()
router.go(-1)

// go forward by 3 records
router.go(3)

// fails silently if there aren't that many records
router.go(-100)
router.go(100)
```

### History Manipulation

You may have noticed that `router.push`, `router.replace` and `router.go` are counterparts of `window.history.pushState`, `window.history.replaceState` and `window.history.go`, and they do imitate the `window.history` APIs.

Therefore, if you are already familiar with [Browser History APIs](https://developer.mozilla.org/en-US/docs/Web/API/History_API), manipulating history will feel familiar when using `@gbarillot/svelte-router`.

It is worth mentioning that `@gbarillot/svelte-router` navigation methods (push, replace, go) work consistently no matter the kind of `mode` option is passed when creating the router instance.

## Different History modes

The `mode` option when creating the router instance allows us to choose among different history modes.

### Hash Mode

The hash history mode is created with `'hash'`:

```javascript
import { createRouter } from '@gbarillot/svelte-router'

const router = createRouter({
  mode: 'hash',
  routes: [
    // ...
  ]
})
```

It uses a hash character (`#`) before the actual URL that is internally passed. Because this section of the URL is never sent to the server, it doesn't require any special treatment on the server level. It does however have a bad impact in SEO. If that's a concern for you, use the HTML5 history mode.

### HTML5 Mode

The HTML5 mode is created with `'web'` and is the recommended mode:

```javascript
import { createRouter } from '@gbarillot/svelte-router'

const router = createRouter({
  mode: 'web',
  routes: [
    // ...
  ]
})
```

When using `'web'`, the URL will look "normal," e.g. `https://example.com/user/id`. Beautiful!

## License

MIT