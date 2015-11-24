/**
 * Copyright 2015 PhotoShelter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var React = require('react');
var ReactAddons = require('react-addons');
var LazyNode = require('./lazynode.jsx');
var utils = require('./utils.jsx');
var $ = require('jquery');

/**
 * Empty div to fill the space occupied by invisible nodes.
 */
var Spacer = React.createClass({
    render: function() {
        var style = {
            width: this.props.width + "px",
            height: this.props.height + "px"
        };
        return (
            <div style={style}></div>
        )
    }
});

/**
 * Lazy-loading nested tree component.
 * Each node is a LazyNode, which loads its children on expand.
 * Nodes are added and removed from the DOM on scroll.
 * TODO: implement lazy-loading sibling nodes.
 */
var LazyTree = React.createClass({

    /**
     * Get the value of the given property at the specified tree path.
     * @param {object} tree: tree state
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {string} prop: property to get the value of
     * @return {object} value of the property at the specified tree path
     */
    getNodeValue: function(tree, treePathA, prop) {
        var subTree = this.getSubTree(tree, treePathA);
        return subTree[prop];
    },

    /**
     * Return the subtree object at the given subtree path.
     * @param {object} tree: tree state
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @return {object} the subtree at the specified path
     */
    getSubTree: function(tree, treePathA) {
        var subTree = tree, pathIndex;
        if (treePathA.length === 0) return tree;
        pathIndex = treePathA[0];
        subTree = tree[pathIndex];
        for (var i = 1; i < treePathA.length; i++) {
            pathIndex = treePathA[i];
            subTree = subTree.children;
            if (!subTree[pathIndex]) {
                subTree[pathIndex] = {};
                subTree[pathIndex].children = {};
            }
            subTree = subTree[pathIndex];
        }
        return subTree;
    },

    /**
     * Convert a tree path to an object specifying how to traverse the internal tree data structure.
     *
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {string} command: '$set' if replacing the node's value with a new value,
     * or '$apply' if value is a function that takes the old value
     * @param {string} prop: property to change eg 'occluded', 'expanded'
     * @param {object} value: a value if command is '$set',
     * or a function that takes the old value and returns a new one if command is '$apply'
     * @return {object} object representing the given tree path
     */
    getSubTreePathObj: function(treePathA, command, prop, value) {
        if (!treePathA) return {};
        var pathObj = {}, pathIndex;
        var pathObjHead = pathObj;
        for (var i = 0; i < treePathA.length - 1; i++) {
            pathIndex = treePathA[i];
            pathObj[pathIndex] = {};
            pathObj = pathObj[pathIndex];
            pathObj['children'] = {};
            pathObj = pathObj['children'];
        }
        pathIndex = treePathA[i];
        pathObj[pathIndex] = {};
        pathObj = pathObj[pathIndex];
        if (command === '$set') {
            pathObj[prop] = {$set: value};
        } else {
            pathObj[prop] = {$apply: value};
        }
        return pathObjHead;
    },

    /**
     * Set a property value of a given tree node.
     * @param {object} tree: tree state
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {string} prop: property to set
     * @param {object} val: value to set the property to
     * @return {object} updated tree
     */
    setNodeValueImmutable: function(tree, treePathA, prop, val) {
        if (!treePathA) return tree;
        var command, value;
        if (val === 'toggle') {
            command = '$apply';
            value = function(isExpanded) { return !isExpanded; };
        } else {
            command = '$set';
            value = val;
        }
        var subTreePathObj = this.getSubTreePathObj(treePathA, command, prop, value);
        return ReactAddons.update(tree, subTreePathObj);
    },

    /**
     * Set the value of the given property for all children of the specified parent.
     * @param {object} tree: tree state
     * @param {string[]} treePathParentA: tree path for the parent node
     * @param {string} prop: property to set for all immediate children of the parent
     * @param {object} val: value to set the property to for all children
     * @return {object} updated tree
     */
    setChildNodesValueImmutable: function(tree, treePathParentA, prop, val) {
        var fn = function(childrenObj) {
            for (var pathIndex in childrenObj) {
                if (childrenObj.hasOwnProperty(pathIndex)) {
                    if (val === 'toggle') {
                        childrenObj[pathIndex][prop] = !childrenObj[pathIndex][prop];
                    } else {
                        childrenObj[pathIndex][prop] = val;
                    }
                }
            }
            return childrenObj;
        };
        var subTreePathObj = this.getSubTreePathObj(treePathParentA, '$apply', 'children', fn);
        return ReactAddons.update(tree, subTreePathObj);
    },

    /**
     * Recursively convert a nested object (tree) to a sequential set of labels.
     * Nodes are sequentially placed adjacent to their immediate children.
     * @param {string} label: subtree label
     * @param {object} tree: subtree being processed
     */
    treeToArray: function(label, tree) {
        if (typeof tree != 'object') return [];
        var sequentialNodesA = [], subTree, subLabel, accLabel;
        for (subLabel in tree) {
            if (tree.hasOwnProperty(subLabel)) {
                subTree = tree[subLabel];
                if (subTree['deployed']) {
                    accLabel = label.concat(subLabel);
                    sequentialNodesA = sequentialNodesA.concat([accLabel])
                    .concat(this.treeToArray(accLabel, subTree.children));
                }
            }
        }
        return sequentialNodesA;
    },

    /**
     * @return {object} initial state
     */
    getInitialState: function() {
        return {
            nodeTreeState: {'root':{'children':{}}},
            sequentialNodesA: null,
            spacerHeights: [0, 0]
        };
    },

    /**
     * Return true if the node is currently NOT visible.
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {number} nodeIndex: sequential position of the node
     * @param {object} tree: tree object
     * @param {number} scroll: current scroll position (in px)
     * @param {number} panelHeight: height of the panel containing visible nodes (in px)
     * @param {number} nodeHeight: height of each node (in px)
     * @return {boolean} true if the node is NOT currently visible.
     */
    isNodeOccluded: function(treePathA, nodeIndex, tree, scroll, panelHeight, nodeHeight) {
        tree = tree || this.state.nodeTreeState;
        nodeIndex = nodeIndex || this.getNodeValue(tree, treePathA, 'position');
        scroll = scroll || this.getScrollPosition();
        panelHeight = panelHeight || this.getPanelHeight();
        nodeHeight = nodeHeight || this.getNodeHeight();
        var viewTop = scroll;
        var viewBottom = viewTop + panelHeight;
        var nodeTop = nodeIndex * nodeHeight + 1; // position of top of node in px
        var nodeBottom = nodeTop + nodeHeight - 1; // position of bottom of node in px
        var isOccluded = viewBottom < nodeTop || nodeBottom < viewTop;
        return isOccluded;
    },

    /**
     * Set a particular node's deployed status. A node is deployed if its parent node is expanded.
     * @param {object} tree: tree object
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {object} nodeProps: TODO describe
     */
    toggleStateDeployed: function(tree, treePathA, nodeProps) {
        // Lazy-load additional child nodes when the parent is expanded:
        var setChildLabels = function(treePathA, childrenLoaded) {
            // update cache of loaded children:
            utils.treePathsLoaded[treePathA] = childrenLoaded;
            var children = {};
            var labels = utils.getChildLabels(treePathA, nodeProps);
            labels.forEach(function(label, index) {
                children[index] = {'label': label, 'deployed': false, 'children': {}};
            });
            tree = this.setNodeValueImmutable(tree, treePathA, 'children', children);
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', true);
            tree = this.setChildNodesValueImmutable(tree, treePathA, 'deployed', true);
            this.setSequentialTreeState(tree);
        }.bind(this);
        if (!utils.areChildrenLoaded(treePathA, nodeProps)) {
            var failCb = function(path, nodes) { console.warn('LazyTree: failed to load path ' + path);};
            this.props.loadChildren(treePathA, setChildLabels, failCb);
            // Expand the node now to show the "loading" spinner:
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', true);
            this.setState({nodeTreeState: tree});
        } else {
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', 'toggle');
            tree = this.setChildNodesValueImmutable(tree, treePathA, 'deployed', 'toggle');
            this.setSequentialTreeState(tree);
        }
    },

    /**
     * Set the sequential position index for each deployed node in the tree.
     * @param {object} tree: tree object
     */
    setSequentialTreeState: function(tree) {
        var spacerHeights;
        var nodesA = this.treeToArray([], this.getSubTree(tree, this.treePath([])).children);
        var updateTree = function(nodesA) {
            return function(tree) {
                var subTree, path;
                for (var i = 0; i < nodesA.length; i++) {
                    path = nodesA[i];
                    subTree = this.getSubTree(tree, path);
                    subTree['position'] = i;
                    subTree['occluded'] = this.isNodeOccluded(path, i, tree); // TODO: pass nodeHeight?
                }
                return tree;
            }.bind(this);
        }.bind(this);
        tree = ReactAddons.update(tree, {root: {children: {$apply: updateTree(nodesA)}}});
        // Cache viewport edges:
        this.setViewportEdgeIndicesA(this.viewportEdgeIndicesA(tree, nodesA));
        // Update the top and bottom spacer heights:
        spacerHeights = this.getSpacerHeights(tree, nodesA, this.getViewportEdgeIndicesA());
        this.setState({
            nodeTreeState: tree,
            sequentialNodesA: nodesA,
            spacerHeights: spacerHeights
        });
    },

    /**
     * Set a particular node's expanded status. A collapsed node is expanded when clicked.
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     * @param {object} nodeProps: TODO describe
     */
    toggleNodeExpanded: function(treePathA, nodeProps) {
        var tree = this.state.nodeTreeState;
        this.toggleStateDeployed(tree, treePathA, nodeProps);
    },

    /**
     * Return true if a node is expanded.
     * @param {string[]} treePathA: tree path eg ['root', 1, 2]
     */
    isNodeExpanded: function(treePathA) {
        return this.getNodeValue(this.state.nodeTreeState, treePathA, 'expanded');
    },

    // FIXME: how to always return the root element even 
    // before mounting, when this.getDOMNode() is not available?
    getRootElement: function() {
        return this.props.rootElement;
    },

    getScrollPosition: function() {
        var root = this.getRootElement();
        var scroll = root.scrollTop;
        return scroll;
    },

    getPanelHeight: function() {
        var root = this.getRootElement();
        return root.clientHeight;
    },

    getNodeHeight: function() {
        return this.props.nodeHeight;
    },

    getViewportEdgeIndicesA: function() {
        return this.cachedViewportEdgeIndicesA;
    },

    setViewportEdgeIndicesA: function(viewportEdgeIndicesA) {
        this.cachedViewportEdgeIndicesA = viewportEdgeIndicesA;
    },

    /**
     * Find the first and last visible node in the given array of node paths.
     * Performs a binary search of the specified nodes to detect the first and last visible node.
     * @param {string[][]} childPathsA: array of node paths to search
     * @return {object} array of [top, bottom], the first visible node and last visible node.
     */
    getChildViewportEdgeIndicesA: function(childPathsA) {
        var viewportEdges = this.getViewportEdgeIndicesA();
        var topEdge = viewportEdges[0];
        var bottomEdge = viewportEdges[1];
        var findTopChild = function(topEdge) {
            return function(path) {
                var seqPos = this.getNodeValue(this.state.nodeTreeState, path, 'position');
                return (seqPos < topEdge);
            }.bind(this);
        }.bind(this);
        var findBottomChild = function(bottomEdge) {
            return function(path) {
                var seqPos = this.getNodeValue(this.state.nodeTreeState, path, 'position');
                return (seqPos <= bottomEdge);
            }.bind(this);
        }.bind(this);
        var topChild = this.binarySearch(childPathsA, 0, childPathsA.length - 1, findTopChild(topEdge));
        topChild = 0 < topChild <= topEdge ? topChild : -1;
        var bottomChild = this.binarySearch(childPathsA, 0, childPathsA.length - 1, findBottomChild(bottomEdge));
        bottomChild = bottomEdge <= bottomChild < this.state.sequentialNodesA.length ? bottomChild : -1;
        return [topChild, bottomChild];
    },

    /**
     * @callback checkPath
     * @param {string[]} treePathA: tree path of node
     */

    /**
     * Perform a binary search of the given array.
     *
     * @param {object} a: array to search
     * @param {number} s: starting index
     * @param {number} e: end index
     * @param {checkPath} check: function to call to check if an element is within bounds
     * @return {object} the position of the first array element that fails the check condition
     */
    binarySearch: function(a, s, e, check) {
        if (s === e) return e;
        var mid = Math.ceil((s + e) / 2);
        if (check(a[mid])) {
            return this.binarySearch(a, mid, e, check);
        } else {
            return this.binarySearch(a, s, mid - 1, check);
        }
    },

    /**
     * Return the sequential positions of the last occluded node above, and the first occlude node below.
     * @param {object} [nodeTreeState]: current tree state (taken from this.state if not given)
     * @param {string[][]} [nodesA]: sequential array of node paths (taken from this.state if not given)
     * @return {object} array of last occluded node above, and first occluded node below
     */
    viewportEdgeIndicesA: function(nodeTreeState, nodesA) {
        nodeTreeState = nodeTreeState || this.state.nodeTreeState;
        nodesA = nodesA || this.state.sequentialNodesA;
        var i = 0;
        var numDeployedNodes = nodesA.length;
        var occludedAbove, occludedBelow;
        while(i < numDeployedNodes && this.getNodeValue(nodeTreeState, this.treePath(nodesA[i]), 'occluded')) {
            i++;
        }
        occludedAbove = i - 1;
        while(i < numDeployedNodes && !this.getNodeValue(nodeTreeState, this.treePath(nodesA[i]), 'occluded')) {
            i++;
        }
        occludedBelow = i;
        return [occludedAbove, occludedBelow];
    },

    /**
     * Compute and return the height of the spacer divs above and below.
     * @param {object} tree: current tree state TODO: call this nodeTreeState?
     * @param {object} nodesA: sequential array of node paths
     * @param {object} [viewportEdgeIndicesA]: indices of the top and bottom occluded nodes (computed if not specified)
     * @return {object} array containing the top and bottom spacer heights (in px)
     */
    getSpacerHeights: function(tree, nodesA, viewportEdgeIndicesA) {
        viewportEdgeIndicesA = viewportEdgeIndicesA || this.viewportEdgeIndicesA(tree, nodesA);
        var numDeployedNodes = nodesA.length;
        var nodeHeight = this.getNodeHeight();
        var lastOccludedNodeAbove = viewportEdgeIndicesA[0];
        var firstOccludedNodeBelow = viewportEdgeIndicesA[1];
        var topSpacerHeight = lastOccludedNodeAbove > 0 ? lastOccludedNodeAbove * nodeHeight : 0;
        var bottomSpacerHeight = firstOccludedNodeBelow < numDeployedNodes ? (numDeployedNodes - firstOccludedNodeBelow) * nodeHeight : 0;
        return [topSpacerHeight, bottomSpacerHeight];
    },

    // TODO: spacer width should be detected from viewport width
    getSpacerWidth: function() {
        return 430;
    },

    /**
     * Convert a tree path to the internal representation used to address within the tree data structure.
     */
    treePath: function(pathA) {
        return ['root'].concat(pathA);
    },

    /**
     * Scroll event handler.
     * @param {object} e: scroll event
     */
    handleScroll: function(e) {
        // During scroll, the tree structure is constant:
        var nodeTreeState = this.state.nodeTreeState;
        var nodesA = this.state.sequentialNodesA;
        // ... and the scroll position has changed:
        var oldScrollPosition = this.scrollPosition;
        this.scrollPosition = this.getScrollPosition();
        var panelHeight = this.getPanelHeight();
        var oldSpacerHeights = this.state.spacerHeights;
        var nodeHeight = this.getNodeHeight();
        // Update the occlusion status of the nodes:
        var updateTree = function(nodesA, oldScrollPosition, newScrollPosition, panelHeight, nodeHeight) {
            return function(nodeTreeState) {
                var subTree, path;
                var iLast = nodesA.length - 1;
                for (var i = 0; i <= iLast; i++) {
                    path = nodesA[i];
                    subTree = this.getSubTree(nodeTreeState, path);
                    subTree['occluded'] = this.isNodeOccluded(path, i, nodeTreeState, newScrollPosition, panelHeight, nodeHeight);
                }
                return nodeTreeState;
            }.bind(this);
        }.bind(this);
        nodeTreeState = ReactAddons.update(nodeTreeState, {root: {children: {$apply: updateTree(nodesA, oldScrollPosition, this.scrollPosition, panelHeight, nodeHeight)}}});
        this.setViewportEdgeIndicesA(this.viewportEdgeIndicesA(nodeTreeState, nodesA));
        // Update the top and bottom spacer heights:
        var spacerHeights = this.getSpacerHeights(nodeTreeState, nodesA, this.getViewportEdgeIndicesA());
        if (!spacerHeights || spacerHeights[0] !== oldSpacerHeights[0] || spacerHeights[1] !== oldSpacerHeights[1]) {
            this.setState({
                nodeTreeState: nodeTreeState,
                spacerHeights: spacerHeights
            });
        }
    },

    componentWillMount: function() {
        var tree = this.state.nodeTreeState;
        var initTreeState = function(treePathA, childrenLoaded) {
            utils.treePathsLoaded[treePathA] = childrenLoaded;
            var topNodes = utils.getChildLabels(this.treePath([]), this.props);
            var children = {};
            // Init a large tree with variable numbers of nodes at the second level:
            topNodes.forEach(function(label, index) {
                children[index] = {'label': label, 'deployed': true, 'children': {}};
            });
            tree = this.setNodeValueImmutable(tree, this.treePath([]), 'children', children);
            var nodesA = this.treeToArray([], this.getSubTree(tree, this.treePath([])).children);
            var panelHeight = this.getPanelHeight(); // FIXME: these are approximate values since DOM nodes can't yet be queried
            var nodeHeight = this.getNodeHeight();
            var updateTree = function(nodesA, scrollPosition, panelHeight, nodeHeight) {
                return function(nodeTreeState) {
                    var subTree, path;
                    var iLast = nodesA.length - 1;
                    for (var i = 0; i <= iLast; i++) {
                        path = nodesA[i];
                        subTree = this.getSubTree(nodeTreeState, path);
                        subTree['position'] = i;
                        subTree['occluded'] = this.isNodeOccluded(path, i, nodeTreeState, scrollPosition, panelHeight, nodeHeight);
                    }
                    return nodeTreeState;
                }.bind(this);
            }.bind(this);
            tree = ReactAddons.update(tree, {root: {children: {$apply: updateTree(nodesA, 0, panelHeight, nodeHeight)}}});
            this.setViewportEdgeIndicesA(this.viewportEdgeIndicesA(tree, nodesA));
            var spacerHeights = this.getSpacerHeights(tree, nodesA, this.getViewportEdgeIndicesA());
            this.setState({
                nodeTreeState: tree,
                sequentialNodesA: nodesA,
                spacerHeights: spacerHeights
            });
        }.bind(this);
        if (!utils.areChildrenLoaded(this.treePath([]), this.props)) {
            // TODO: retry load on fail?
            var failCb = function(path, nodes) { console.warn('LazyTree: failed to load path ' + path);};
            this.props.loadChildren(this.treePath([]), initTreeState, failCb);
        }
    },

    componentWillUpdate: function() {
        this.scrollPosition = this.getScrollPosition();
    },

    getChildData: function(treePath) {
        return this.getSubTree(this.state.nodeTreeState, treePath).children;
    },

    render: function() {
        if (!utils.areChildrenLoaded(this.treePath([]), this.props)) {
            return (<div className="loading"><p>Loading ...</p></div>);
        }
        var topNodes = Object.keys(this.getChildData(this.treePath([])));
        var childPaths = [];
        topNodes.forEach(function(key) {
            childPaths.push(this.treePath([key]));
        }.bind(this));
        var viewportEdges = this.getChildViewportEdgeIndicesA(childPaths);
        var nodesToRender = [];
        nodesToRender.push(<Spacer key={'spacer-top'} height={this.state.spacerHeights[0]} width={this.getSpacerWidth()}/>);
        for (var i = viewportEdges[0]; i <= viewportEdges[1]; i ++) {
            if (i < 0) continue;
            var childTreePath = this.treePath([i]);
            var key = utils.arrayToKeyString(childTreePath);
            var nodeLabel = this.getNodeValue(this.state.nodeTreeState, childTreePath, 'label');
            nodesToRender.push(<LazyNode
                key={key}
                nodeLabel={nodeLabel}
                treePathA={childTreePath}
                childData={this.getChildData(childTreePath)}
                toggleNodeExpanded={this.toggleNodeExpanded}
                isNodeExpanded={this.isNodeExpanded}
                isNodeOccluded={this.isNodeOccluded}
                getChildViewportEdgeIndicesA={this.getChildViewportEdgeIndicesA}
                getChildData={this.getChildData}
            />);
        }
        nodesToRender.push(<Spacer key={'spacer-bottom'} height={this.state.spacerHeights[1]} width={this.getSpacerWidth()}/>);
        var pools = (<div>{nodesToRender}</div>);
        return pools;
    },

    componentDidUpdate: function() {
        var scroll = this.getScrollPosition();
    },

    componentDidMount: function() {
        this.scrollPosition = this.getScrollPosition();
        this.getRootElement().onmousewheel = function(e) {
            this.handleScroll(e);
        }.bind(this);
    }

});

module.exports = LazyTree;
