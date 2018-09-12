module.exports = function(callback, timeout) {
    let hnd = null;
    return {
        reset: function() {
            if (hnd) window.clearTimeout(hnd);
            hnd = window.setTimeout(callback, timeout);
        }
    }
}
