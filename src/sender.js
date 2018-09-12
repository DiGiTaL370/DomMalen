class Sender {
    constructor(url) {
        this.url = url;

        this.permanent = {};
        this.temporary = {};
        this.callbacks = {
            "open": [],
            "close": [],
            "message": []
        };

        console.log("Sender construction.");
        this.openSocket();
    }

    openSocket() {
        this.socket = new WebSocket(this.url);
        this.socket.onclose = (e) => {
            this.callbacks["close"].forEach((c) => c(e));
            this.openSocket();
        }
        this.socket.onopen = (e) => {
            this.callbacks["open"].forEach((c) => c(e));
        }
        this.socket.onmessage = (e) => {
            let data = JSON.parse(e.data);
            this.callbacks["message"].forEach((c) => c(data));
        }
    }

    addPermanentProps(obj) {
        Object.assign(this.permanent, obj);
    }

    addTemporaryProps(obj) {
        Object.assign(this.temporary, obj);
    }

    send(obj) {
        if (this.socket.readyState !== this.socket.OPEN) return false;

        if (obj) Object.assign(this.temporary, obj);
        Object.assign(this.temporary, this.permanent);

        this.socket.send(JSON.stringify(this.temporary));
        console.debug(this.temporary);
        this.temporary = {};
    }

    on(event, callback) {
        this.callbacks[event].push(callback);
    }
}

module.exports = Sender;
