#LazyTree

A nested "file" tree React.js component, with streaming scroll and lazy-loading child nodes.

## Demo

This video shows the demo included in the `demo` directory:

![LazyTree demo](static/lazytree-demo.gif)

This is the same demo with the [DOMViz]() Chrome extension enabled,
which highlights DOM mutations:

![LazyTree demo using the DomViz Chrome extension](static/lazytree-demo-domviz.gif)

DOM nodes are added and removed on scroll, and on node expand/collapse.

## Installation

## Usage

```javascript
    var LazyTree = require('lazytree.jsx');
```

```javascript
    var root = $("#root")[0];
    <LazyTree
        loadChildren={loadChildren}
        nodeHeight={30}
        rootElement={root}
    />
```


## License

Apache 2.0

## TODO:

- Implement lazy-loading scroll with `loadSiblings` callback
(could use [Waypoint](https://github.com/brigade/react-waypoint))
- Fix scrollbar so it shows full size of list

### Generating GIFs

Converting .mov files to .gif files using the ffmpeg CLI:

```bash
    ffmpeg -i ~/Desktop/lazytree-demo-domviz.mov -s 359x380 -filter:v "setpts=0.5*PTS" -t 5 -f gif - | gifsicle --optimize=3 > lazytree-demo-domviz.gif
```

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
