jest.dontMock('../lazytree.jsx');

describe('lazytree', function() {
    it('does stuff', function() {
        var LazyTree = require('../lazytree.jsx');
        expect(LazyTree.getInitialState.spacerHeights).toBe([0,0]);
    });
});
