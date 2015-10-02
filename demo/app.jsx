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

var LazyTree = require('../src/lazytree.jsx');
var React = require('react');
var $ = require('jquery');

var nodeCallbacks = {
    arrayToLabelString: function(a) {
        var labelStr = '';
        a.forEach(function(e, i) {
            labelStr += e;
            if (i < a.length - 1) labelStr += ', ';
        });
        return labelStr;
    },

    /*
     * Returns the label for the node at treePath.
     */
    getTerm: function(treePath, props) {
        var term = this.arrayToLabelString(treePath);
        var inheritedProps = this.extractInheritedProps(props);
        term += " (" + inheritedProps.level + ")";
        return term;
    },

    /*
     * Returns true if the local cache contains the given tree path.
     */
    treePathsLoaded: {},
    areChildrenLoaded: function(treePath, props) {
        var areLoaded = typeof this.treePathsLoaded[treePath] === 'object' ? true : false;
        return areLoaded;
    },

    /*
     * Get the children loaded at the specified tree path.
     */
    getChildLabels: function(treePath, props) {
        return this.treePathsLoaded[treePath];
    },

    MAX_CHILD_NODES: 10,
    MAX_NODES_L1: 1000,
    /*
     * Returns an array of labels for all children under the node at treePath.
     * treePath starts with ['root'] for the root node. Then ['root', 0] is the first child of the root.
     * ['root', 1] is the second child of the root. etc.
     */
    loadChildren: function(treePath, props, successCallback, failCallback) {
        var numNodes;
        var maxNodes;
        if (!treePath) return [];
        if (treePath.length === 1) {
            maxNodes = this.MAX_NODES_L1;
        } else {
            maxNodes = this.MAX_CHILD_NODES;
        }
        numNodes = Math.max(Math.floor(Math.random() * maxNodes), 1);
        var nodes = [];
        for (var i = 0; i < numNodes; i ++) {
            nodes.push(this.getTerm(treePath.concat(i), props));
        }
        // Set a short delay proportional to the number of child nodes:
        window.setTimeout(function(successCb, failCb) {
            this.treePathsLoaded[treePath] = nodes;
            successCb(treePath);
            // FIXME: what would the fail condition be?
        }.bind(this, successCallback, failCallback), Math.min(numNodes * 100, 1000));
    },

    extractInheritedProps: function(parentProps) {
        var inheritedProps;
        if (parentProps.inheritedProps) {
            inheritedProps = parentProps.inheritedProps;
        } else {
            inheritedProps = parentProps;
        }
        return inheritedProps;
    },

    getInheritedProps: function(treePath, parentProps) {
        var childProps = {};
        var inheritedProps = this.extractInheritedProps(parentProps);
        childProps.level = inheritedProps.level + 1;
        return childProps;
    }
};

$(document).ready(function() {
    var root = $("#root");
    root = root[0] || null;
    if (!root) return null;
    React.render(
        <LazyTree nodeCallbacks={nodeCallbacks} level={0} rootElement={root}/>,
        root
    );
});

