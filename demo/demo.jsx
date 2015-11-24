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
var reactDOM = require('react-dom');
var React = require('react');
var $ = require('jquery');

var NODE_HEIGHT = 30;

var arrayToLabelString = function(a) {
    var labelStr = '';
    a.forEach(function(e, i) {
        labelStr += e;
        if (i < a.length - 1) labelStr += ', ';
    });
    return labelStr;
};

/*
 * Returns the label for the node at treePathA.
 * TODO: improve treePathA description
 * @param {string[]} treePathA: tree path eg ['root', 1, 2]
 */
var getTerm = function(treePathA) {
    var term = arrayToLabelString(treePathA);
    return term;
};

/**
 * @callback loadChildrenCallback
 * TODO: omit the root from the tree path so it matches number[]?
 * @param {string[]} treePathA: tree path eg ['root', 1, 2]
 * @param {string[]} nodesA: array of child node labels loaded
 */

/**
 * Loads children under the node at the specified tree path.
 * `treePathA` structure:
 * - ['root'] is the root node
 * - ['root', 0] is the first child of the root
 * - ['root', n-1] is the nth child of the root
 * - ['root', 2, 1] is two levels deep, etc
 * @param {string[]} treePathA: tree path eg ['root', 1, 2]
 * @param {loadChildrenCallback} successCb: callback called on successful load
 * @param {loadChildrenCallback} failCb: callback called on failed load
 */
var loadChildren = function(treePathA, successCb, failCb) {
    var MAX_CHILD_NODES = 10;
    var MAX_NODES_L1 = 1000;
    var numNodes;
    var maxNodes;
    if (!treePathA) return null;
    if (treePathA.length === 1) {
        maxNodes = MAX_NODES_L1;
    } else {
        maxNodes = MAX_CHILD_NODES;
    }
    numNodes = Math.max(Math.floor(Math.random() * maxNodes), 1);
    var nodes = [];
    for (var i = 0; i < numNodes; i ++) {
        nodes.push(getTerm(treePathA.concat(i)));
    }
    // Simulate a network call by setting an artificial delay
    // proportional to the number of child nodes:
    window.setTimeout(function(successCb, failCb) {
        // A contrived failure condition that will never happen:
        if (nodes.length !== numNodes) {
            failCb(treePathA, nodes);
        } else {
            successCb(treePathA, nodes);
        }
    }.bind(this, successCb, failCb), Math.min(numNodes * 100, 1000));
};

$(document).ready(function() {
    var root = $("#root");
    root = root[0] || null;
    if (!root) return null;
    reactDOM.render(
        <LazyTree loadChildren={loadChildren} nodeHeight={NODE_HEIGHT} rootElement={root}/>,
        root
    );
});

