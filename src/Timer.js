class Timer{
    constructor(callback, interval) {
        this.hnd = null;
        this.callback = callback;
        this.interval = interval;
    }

    start() {
        if (this.hnd) window.clearInterval(this.hnd);
        this.hnd = window.setInterval(this.callback, this.interval);
    }

    stop() {
        if (this.hnd) window.clearInterval(this.hnd);
        this.hnd = null;
    }

    setActive(bool) {
        bool ? this.start() : this.stop();
    }
}

module.exports = Timer;
