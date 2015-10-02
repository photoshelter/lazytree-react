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

exports.LazyNode = LazyNode;
