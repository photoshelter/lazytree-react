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

/** @jsx React.DOM */
var arrayToKeyString = function(a) {
    var s = "", len = a.length;
    a.forEach(function(e, i) {
        s += e;
        if (i < len - 1) {
            s += '-';
        }
    });
    return s;
};

var LazyNode = React.createClass({

    /*
    arrayToLabelString: function(a) {
        var labelStr = '';
        a.forEach(function(e, i) {
            labelStr += e;
            if (i < a.length - 1) labelStr += ', ';
        });
        return labelStr;
    },
    */

    toggle: function() {
        this.props.toggleNodeExpanded(this.props.treePathA, this.props);
    },

    getNodeLabel: function() {
        var nodeLabel = this.props.nodeLabel;
        // var treePathStr = this.arrayToLabelString(this.props.treePathA);
        // nodeLabel = nodeLabel + ': [' + treePathStr + ']';
        return nodeLabel;
    },

    render: function() {
        var nodeLabel = this.getNodeLabel();
        var isOccluded = this.props.isNodeOccluded(this.props.treePathA);
        var isExpanded = this.props.isNodeExpanded(this.props.treePathA);

        var childNodes = [];
        // If this node is expanded, render its (visible) children:
        if (isExpanded) {
            var isLoaded = this.props.nodeCallbacks.areChildrenLoaded(this.props.treePathA, this.props);
            if (!isLoaded) {
                childNodes.push(<div className="loading"><p>Loading ...</p></div>);
            } else {
                var childLabels = this.props.nodeCallbacks.getChildLabels(this.props.treePathA, this.props);
                var numChildNodes = childLabels.length;
                var childPaths = [];
                var head;
                childLabels.forEach(function(child, index) {
                    childPaths.push(this.props.treePathA.concat(index));
                }.bind(this));
                var childViewportEdgeIndicesA = this.props.getChildViewportEdgeIndicesA(childPaths);
                var indexLastNodeOccludedAbove = childViewportEdgeIndicesA[0];
                indexLastNodeOccludedAbove = indexLastNodeOccludedAbove > 0 ? indexLastNodeOccludedAbove : 0;
                var indexFirstNodeOccludedBelow = childViewportEdgeIndicesA[1];
                indexFirstNodeOccludedBelow = indexFirstNodeOccludedBelow > 0 ? indexFirstNodeOccludedBelow : numChildNodes - 1;
                var childLabel, childTreePathA, nodeKey, index, inheritedProps;
                for (index = indexLastNodeOccludedAbove; index <= indexFirstNodeOccludedBelow; index ++) {
                    childTreePathA = this.props.treePathA.concat(index);
                    if (typeof this.props.nodeCallbacks.getInheritedProps === 'function') {
                        inheritedProps = this.props.nodeCallbacks.getInheritedProps(childTreePathA, this.props);
                    }
                    childLabel = childLabels[index];
                    nodeKey = arrayToKeyString(childTreePathA);
                    childNodes.push(<LazyNode
                        key={nodeKey}
                        nodeLabel={childLabel}
                        childData={this.props.getChildData(childTreePathA)}
                        treePathA={childTreePathA}
                        toggleNodeExpanded={this.props.toggleNodeExpanded}
                        isNodeExpanded={this.props.isNodeExpanded}
                        isNodeOccluded={this.props.isNodeOccluded}
                        getChildViewportEdgeIndicesA={this.props.getChildViewportEdgeIndicesA}
                        getChildData={this.props.getChildData}
                        nodeCallbacks={this.props.nodeCallbacks}
                        inheritedProps={inheritedProps}
                    />);
                }
            }
        }

        if (isOccluded) {
            if (!isExpanded) {
                // If this node is OCCLUDED and is NOT EXPANDED, then don't need
                // to render it or its children:
                return null;
            } else {
                // If it's OCCLUDED but also IS EXPANDED, then render any
                // children that may be visible below it:
                return (
                    <li>
                        <ul>
                            {childNodes}
                        </ul>
                    </li>
                );
            }
        } else {
            head = (<div className="node"><h3 onClick={this.toggle} className={isExpanded ? "on" : ''}>{nodeLabel}</h3></div>);
            if (!isExpanded) {
                // If this node is VISIBLE but NOT EXPANDED, then just
                // render the node, but no children:
                return (
                    <li>
                        {head}
                    </li>
                );
            } else {
                // If it's VISIBLE and IS EXPANDED, then
                // render the node and it's children:
                return (
                    <li>
                        {head}
                        <ul>
                            {childNodes}
                        </ul>
                    </li>
                );
            }
        }
    }

});

/*****************************/

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

/*****************************/
var LazyTree = React.createClass({

    getNodeValue: function(tree, treePathA, prop) {
        var subTree = this.getSubTree(tree, treePathA);
        return subTree[prop];
    },

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
        return React.addons.update(tree, subTreePathObj);
    },

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
        return React.addons.update(tree, subTreePathObj);
    },

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

    getInitialState: function() {
        return {
            nodeTreeState: {'root':{'children':{}}},
            sequentialNodesA: null,
            spacerHeights: [0, 0]
        };
    },

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

    toggleStateDeployed: function(tree, treePathA, nodeProps) {
        // Lazy-load additional child nodes when the parent is expanded:
        var setChildLabels = function(treePathA) {
            var children = {};
            var labels = this.props.nodeCallbacks.getChildLabels(treePathA, nodeProps);
            labels.forEach(function(label, index) {
                children[index] = {'label': label, 'deployed': false, 'children': {}};
            });
            tree = this.setNodeValueImmutable(tree, treePathA, 'children', children);
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', true);
            tree = this.setChildNodesValueImmutable(tree, treePathA, 'deployed', true);
            this.setSequentialTreeState(tree);
        }.bind(this);
        if (!this.props.nodeCallbacks.areChildrenLoaded(treePathA, nodeProps)) {
            this.props.nodeCallbacks.loadChildren(treePathA, nodeProps, setChildLabels, null);
            // Expand the node now to show the "loading" spinner:
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', true);
            this.setState({nodeTreeState: tree});
        } else {
            tree = this.setNodeValueImmutable(tree, treePathA, 'expanded', 'toggle');
            tree = this.setChildNodesValueImmutable(tree, treePathA, 'deployed', 'toggle');
            this.setSequentialTreeState(tree);
        }
    },

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
        tree = React.addons.update(tree, {root: {children: {$apply: updateTree(nodesA)}}});
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

    toggleNodeExpanded: function(treePathA, nodeProps) {
        var tree = this.state.nodeTreeState;
        this.toggleStateDeployed(tree, treePathA, nodeProps);
    },

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

    NODE_HEIGHT_GUESS: 30,
    cacheNodeHeight: function() {
        var nodes = $("div.node");
        if (nodes.length < 1) {
            this.NODE_HEIGHT = this.NODE_HEIGHT_GUESS;
        } else {
            var listItem = nodes[0];
            this.NODE_HEIGHT = listItem.offsetHeight;
        }
        return this.NODE_HEIGHT;
    },

    getNodeHeight: function() {
        return this.NODE_HEIGHT;
    },

    getViewportEdgeIndicesA: function() {
        return this.cachedViewportEdgeIndicesA;
    },

    setViewportEdgeIndicesA: function(viewportEdgeIndicesA) {
        this.cachedViewportEdgeIndicesA = viewportEdgeIndicesA;
    },

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

    binarySearch: function(a, s, e, check) {
        if (s === e) return e;
        var mid = Math.ceil((s + e) / 2);
        if (check(a[mid])) {
            return this.binarySearch(a, mid, e, check);
        } else {
            return this.binarySearch(a, s, mid - 1, check);
        }
    },

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

    getSpacerWidth: function() {
        return 430;
    },

    treePath: function(pathA) {
        return ['root'].concat(pathA);
    },

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
        nodeTreeState = React.addons.update(nodeTreeState, {root: {children: {$apply: updateTree(nodesA, oldScrollPosition, this.scrollPosition, panelHeight, nodeHeight)}}});
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
        var initTreeState = function() {
            var topNodes = this.props.nodeCallbacks.getChildLabels(this.treePath([]), this.props);
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
            tree = React.addons.update(tree, {root: {children: {$apply: updateTree(nodesA, 0, panelHeight, nodeHeight)}}});
            this.setViewportEdgeIndicesA(this.viewportEdgeIndicesA(tree, nodesA));
            var spacerHeights = this.getSpacerHeights(tree, nodesA, this.getViewportEdgeIndicesA());
            this.setState({
                nodeTreeState: tree,
                sequentialNodesA: nodesA,
                spacerHeights: spacerHeights
            });
        }.bind(this);
        if (!this.props.nodeCallbacks.areChildrenLoaded(this.treePath([]), this.props)) {
            this.props.nodeCallbacks.loadChildren(this.treePath([]), this.props, initTreeState, null);
        }
    },

    componentWillUpdate: function() {
        this.scrollPosition = this.getScrollPosition();
    },

    getChildData: function(treePath) {
        return this.getSubTree(this.state.nodeTreeState, treePath).children;
    },

    render: function() {
        if (!this.props.nodeCallbacks.areChildrenLoaded(this.treePath([]), this.props)) {
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
            var key = arrayToKeyString(childTreePath);
            var nodeLabel = this.getNodeValue(this.state.nodeTreeState, childTreePath, 'label');
            var inheritedProps = {};
            if (typeof this.props.nodeCallbacks.getInheritedProps === 'function') {
                inheritedProps = this.props.nodeCallbacks.getInheritedProps(childTreePath, this.props);
            }
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
                nodeCallbacks={this.props.nodeCallbacks}
                inheritedProps={inheritedProps}
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
        this.cacheNodeHeight();
        this.scrollPosition = this.getScrollPosition();
        this.getRootElement().onmousewheel = function(e) {
            this.handleScroll(e);
        }.bind(this);
    }

});
