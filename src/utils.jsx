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

exports.arrayToKeyString = arrayToKeyString;
