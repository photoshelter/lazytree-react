jest.dontMock('../lazytree.jsx');
jest.dontMock('../lazynode.jsx');

var LazyTree = require('../lazytree.jsx');

var React = require('react');
var TestUtils = require('react-addons-test-utils');
//var expect = require('chai').expect;

describe('lazytree', function() {
    it('does stuff', function() {
        var LazyTree = require('../lazytree.jsx');
        var tree = TestUtils.renderIntoDocument(
            <LazyTree
                loadChildren = {() => {}}
                nodeHeight = {30}
            ></LazyTree>
        );
        expect(LazyTree.getInitialState().spacerHeights).to.equal([0,0]);
    });
});
