// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support
  hidden = "hidden";
  visibilityChange = "visibilitychange";
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";
}

module.exports = {
    hidden: function() {
        return document[hidden];
    },

    onChange: function(callback) {
        document.addEventListener(visibilityChange, callback);
    },

    removeOnChange: function(callback) {
        document.removeEventListener(visibilityChange, handle);
    }
}
