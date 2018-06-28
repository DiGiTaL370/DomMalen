class Sender {
    constructor(url) {
        this.url = url;

        this.permanent = {};
        this.temporary = {};

        console.log("Sender construction.");
        this.openSocket();
    }

    openSocket() {
        console.log("OpenSocket.");
        
        this.socket = new WebSocket(this.url);
        this.socket.onclose = () => this.openSocket();
    }

    addPermanentProps(obj) {
        Object.assign(this.permanent, obj);
    }

    addTemporaryProps(obj) {
        Object.assign(this.temporary, obj);
    }

    send(obj) {
        console.log("Sending.");
        
        if (this.socket.readyState !== this.socket.OPEN) return false;

        if (obj) Object.assign(this.temporary, obj);
        Object.assign(this.temporary, this.permanent);

        this.socket.send(JSON.stringify(this.temporary));
        this.temporary = {};
    }
}

module.exports = Sender;
