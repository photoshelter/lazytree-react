#LazyTree

A nested "file" tree React.js component, with streaming scroll and lazy-loading child nodes.

## LazyTree: a lazy-loading nested 'file' tree in React

__Lazy children__: expand node, children lazy-load:

- expand a node in the UI
- lazy-load child data from server on expand
- add child nodes to the React vDOM

__Lazy siblings__: scroll through the tree, siblings added to vDOM as they come into view:

- add sibling nodes to the vDOM as they are scrolled into view
- TODO: lazy-load pages from server

Component structure:

- Lazy**Tree**
  - Lazy**Node** 1
  - LazyNode 2
    - LazyNode 2,1
    - LazyNode 2,2
    ...
  - LazyNode 3
  ...
  - LazyNode N

LazyTree maintains internal tree state, where a given node is:

- expanded/collapsed (children deployed)
- deployed/un-deployed (parent expanded/collapsed)
- visible/occluded (UI state)

LazyNode uses callbacks from LazyTree to query tree state:

- should I be rendered?
- should my children be rendered?
- which of my children should be rendered?

Which children should be rendered?

- binary search for visible children
- find first visible child
- find first occluded child below it

[DOM viz](https://github.com/paul-jean/dom-viz) Chrome extension:

- useful for visualizing DOM mutations

#License

Apache 2.0
