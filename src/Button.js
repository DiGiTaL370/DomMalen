class ClickButton {
    constructor(element, handler) {
        this.element = element;
        this.handler = handler;

        element.addEventListener("mousedown", this.down.bind(this));
        element.addEventListener("touchstart", this.down.bind(this));

        element.addEventListener("mouseup", this.up.bind(this));
        element.addEventListener("touchend", this.up.bind(this));
    }

    down() {
        this.element.classList.add("active");
    }

    up() {
        this.element.classList.remove("active");
        this.handler();
    }
}

class HoldButton {
    constructor(element, downhandler, uphandler) {
        this.element = element;
        this.downhandler = downhandler;
        this.uphandler = uphandler;

        element.addEventListener("mousedown", this.down.bind(this));
        element.addEventListener("touchstart", this.down.bind(this));

        element.addEventListener("mouseup", this.up.bind(this));
        element.addEventListener("touchend", this.up.bind(this));
    }

    down() {
        this.element.classList.add("active");
        this.downhandler();
    }

    up() {
        this.element.classList.remove("active");
        this.uphandler();
    }
}

module.exports = {ClickButton, HoldButton};
