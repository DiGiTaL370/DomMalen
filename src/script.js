const ft = require("./fulltilt.min.js");
const gl = require("gl-matrix");
const Sender = require("./sender");
const Button = require("./Button");
const Hammer = require("hammerjs");
const Timer = require("./Timer");
const Vis = require("./Visibility");
const delayed = require("./Delayed");
const BanModal = require("./BanModal");

let log = document.getElementById("log");
let xbox = document.getElementById("xcoord");
let ybox = document.getElementById("ycoord");

let showCoords = (x, y) => {
    xbox.innerText = x;
    ybox.innerText = y;
};

let range = [0.5, 0.5];
let resolution = [2000, 2000];

let zeroframe = null;
window.resetPosition = () => {
    zeroframe = null;
};

//let sender = new Sender("ws://beatrix.informatik.rwth-aachen.de:7777");
//let sender = new Sender("ws://brundtland:50000");
let sender = new Sender("wss://flux-dom.ddnss.de:50000");

//let sender = new Sender("ws://herzog.informatik.rwth-aachen.de:50000");
//let sender = new Sender("ws://karamanlis:50000");

// User ID
// (() => {
//     let id;
//     let arr = document.cookie.match(/id\=(\d*)/)
//     if (arr && arr[1]) {
//         id = arr[1];
//     } else {
//         id = Math.floor((1 + Math.random()) * 0x10000) * 1000 + new Date().getMilliseconds();
//         let expiry = new Date();
//         expiry.setTime(expiry.getTime() + 365 * 24 * 60 * 60 * 1000);
//         document.cookie = `id=${id};expires=${expiry.toUTCString()};path=/`;
//     }
//     sender.addPermanentProps({id: Math.floor((1 + Math.random()) * 0x10000)});
// })();

// User ID provided by queueing system
(() => {
    sender.on("message", (data) => {
        if (typeof data.id !== "undefined") {
            sender.addPermanentProps({id: data.id});
            console.debug(`Accepted id ${data.id}`);
        }
    });
})();

// Make window fullscreen
document.addEventListener("touchstart", () => {
    var docEl = document.documentElement;
    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    requestFullScreen.call(docEl);
});

// Color selection
let current_color;
(() => {
    let colors = ['#00549F', '#006165', '#0098A1', '#57AB27', '#BDCD00', '#F6A800', '#CC071E', '#A11035', '#612158', '#7A6FAC', '#E30066', '#FFED00'];
    let firstColor = Math.floor(Math.random() * colors.length);
    current_color = colors[firstColor];
    let col = document.getElementById("cs_rest");
    let colorButton = document.getElementById("current");
    for (let i = 0; i < colors.length; i++) {
        let button = document.createElement("div");
        button.id = "color-"+i;
        button.className = "colorbutton button";
        button.style.backgroundColor = colors[i];
        col.appendChild(button);

        let onclick = () => {
            sender.addTemporaryProps({color: colors[i]});
            colorButton.style.backgroundColor = colors[i];
            current_color = colors[i];
            console.log("Select color " + colors[i]);
        };
        button.addEventListener("click", onclick);
        if (i == firstColor) onclick();
    }
})();

// Orientation Timer
(() => {
    const updateOrientation = () => {
        FULLTILT.getDeviceOrientation({type: "world"}).then((or) => {
            let matrix = or.getScreenAdjustedMatrix();
            if (!zeroframe) {
                zeroframe = gl.mat3.create();
                gl.mat3.invert(zeroframe, matrix.elements);
            }
            gl.mat3.multiply(matrix.elements, matrix.elements, zeroframe);
            //log.innerText = JSON.stringify(matrix);

            //let x = matrix.elements[6] / range[0];
            //let y = matrix.elements[7] / Math.sqrt(Math.pow(matrix.elements[7], 2) + Math.pow(matrix.elements[8], 2)) / range[1];

            let x = -(matrix.elements[3]/matrix.elements[4]) / range[0];
            let y = -(matrix.elements[5]/matrix.elements[4]) / range[1];

            x = Math.min(1, Math.max(-1, x));
            y = Math.min(1, Math.max(-1, y));
            x = (x * 0.5 + 0.5) * resolution[0];
            y = (-y * 0.5 + 0.5) * resolution[1];

            sender.send({x: Math.round(x), y: Math.round(y)});
        });
    };

    let orientationTimer = new Timer(updateOrientation, 30);
    let tablet_switch = document.getElementById("tablet_mode");
    let check_timer = () => {
        orientationTimer.setActive(!tablet_switch.checked && !Vis.hidden());
    };
    Vis.onChange(check_timer);
    tablet_switch.addEventListener("change", check_timer);
    check_timer();
})();

// Style Selection
/*let current_style;
(() => {
    let styles = ["thin", "normal", "thick"];
    let styleButton = document.getElementById("current_style");
    let styles_cont = document.getElementById("styles");
    current_style = styles[0];
    for (let i = 0; i < styles.length; i++) {
        let button = document.createElement("div");
        button.className = "button " + styles[i];
        button.dataset["type"] = styles[i];

        const onclick = () => {
            styleButton.className = "button " + styles[i];
            sender.addTemporaryProps({style: styles[i]});
            current_style = styles[i];
        };
        button.addEventListener("click", onclick);

        styles_cont.appendChild(button);
        if (i == 0) onclick();
    }
})();*/

// Multitouch Zoom and Drag of background
(() => {
    let screen = document.getElementById("tablet_screen");
    let hammer = new Hammer.Manager(screen);

    let canvas = document.createElement("canvas");
    canvas.width = 2000;
    canvas.height = 2000;
    screen.appendChild(canvas);
    let ctx = canvas.getContext("2d");
    ctx.lineCap = "round";

    let image = document.createElement("img");
    image.src = "/img/dom_sketch_striped.jpg";
    let clearDrawing = () => {
        ctx.drawImage(image, 0, 0);
    };
    image.addEventListener("load", clearDrawing);

    hammer.add(new Hammer.Pan({ threshold: 0, pointers: 0 }));
	hammer.add(new Hammer.Swipe()).recognizeWith(hammer.get('pan'));
	hammer.add(new Hammer.Rotate({ threshold: 0 })).recognizeWith(hammer.get('pan'));
    hammer.add(new Hammer.Pinch({ threshold: 0 })).recognizeWith([hammer.get('pan'), hammer.get('rotate')]);


    let zoom, xshift, yshift;

    let apply = (x, y, zoom) => {
        window.requestAnimationFrame(() => {
           canvas.style.transform = `translate(${x}px, ${y}px) scale(${zoom })`;
        });
        console.debug({x, y, zoom});
    };

    let reset = () => {
        zoom = Math.min(window.innerHeight, window.innerWidth) / 2000;
        xshift = 0.5 * zoom * (window.innerWidth - 2000);
        yshift = 0.5 * zoom * (window.innerHeight - 2500);
        apply(xshift, yshift, zoom);

    };
    document.getElementById("reset").addEventListener("click", reset);

    let clearDelay = delayed(clearDrawing, 2000);
    hammer.get("pinch").set({enable: true});
    hammer.on("pinchstart pinchmove", (e) => {
        apply(xshift * e.scale + e.deltaX, yshift * e.scale + e.deltaY, zoom * e.scale);
    });
    hammer.on("pinchend pinchcancel", (e)=> {
        zoom *= e.scale;
        xshift = xshift * e.scale + e.deltaX;
        yshift = yshift * e.scale + e.deltaY;
    });
    reset();

    let drawing = false;
    let untransform = (x,y) => {
        let origin = getComputedStyle(canvas).getPropertyValue("transform-origin").replace(/px/g, "").split(" ");
        origin = origin.map((f) => parseFloat(f));

        return {
            x: (x - origin[0] - xshift) / zoom + origin[0],
            y: (y - origin[1] - yshift) / zoom + origin[1]
        };
    };

    let lastxy = null;
    screen.addEventListener("touchstart", (e) => {
        drawing = (e.touches.length == 1);
        if (!drawing) return;
        sender.addTemporaryProps({active: true});
        let finger = e.touches[0];
        lastxy = untransform(finger.pageX, finger.pageY);
        sender.send(lastxy);
        clearDelay.reset();

        ctx.strokeStyle = current_color;
        ctx.lineWidth = 10; // {"thin": 5, "normal": 10, "thick": 15}[current_style];
    });

    screen.addEventListener("touchmove", (e) => {
        if (!drawing) return;
        let finger = e.touches[0];

        ctx.beginPath();
        ctx.moveTo(lastxy.x, lastxy.y);
        lastxy = untransform(finger.pageX, finger.pageY);
        ctx.lineTo(lastxy.x, lastxy.y);
        ctx.stroke();

        sender.send(lastxy);
        clearDelay.reset();
    });

    screen.addEventListener("touchend", () => {
        drawing = false;
        sender.addTemporaryProps({active: false});
        sender.send(lastxy);
        clearDelay.reset();
    });
    screen.addEventListener("touchcancel", () => {
        drawing = false;
        sender.addTemporaryProps({active: false});
        sender.send(lastxy);
        clearDelay.reset();
    });
})();

/* Laserpointer */
(() => {
    let pointer = document.getElementById("laserpointer");
    let ray = document.getElementById("ray");

    let vib = null;

    pointer.addEventListener("touchstart", (e) => {
        sender.addTemporaryProps({active: true});
        ray.style.backgroundColor = current_color;
        pointer.classList.add("active");

        //window.clearInterval(vib);
        //vib = window.setInterval(() => navigator.vibrate(16), 16);
    });

    pointer.addEventListener("touchend", (e) => {
        sender.addTemporaryProps({active: false});
        pointer.classList.remove("active");
        //window.clearInterval(vib);
    });

    pointer.addEventListener("touchcancel", (e) => {
        sender.addTemporaryProps({active: false});
        pointer.classList.remove("active");
        //window.clearInterval(vib);
    });

    document.getElementById("reset").addEventListener("click", () => { window.resetPosition(); });
})();

/* Ban-Modal */
(() =>  {
    window.banModal = BanModal(document.getElementById("ban_modal"));
    sender.on("message", (data) => {
        //console.debug(data);
        if (data.active) return window.banModal.hide();
        if (typeof data.queue !== "undefined") {
            window.banModal.show();
            window.banModal.setQueuePos(data.queue);
            if (typeof data.wait !== "undefined")
                window.banModal.setTime(data.wait);
        }
    });
})();

/* Connect-Modal */
(() => {
    const modal = document.getElementById("connecting_modal");
    if (document.location.hash === "#test") {
        modal.classList.remove("active");
    } else {
        sender.on("open", () => modal.classList.remove("active"));
        sender.on("close", () => modal.classList.add("active"));
    }

    const time_field = modal.querySelector(".time");
    const check_early = () => {
        let now = new Date();
        let start = new Date();
        start.setUTCHours(20);
        start.setUTCMinutes(30);

        let minutes = "" + start.getMinutes();
        time_field.innerText = `${start.getHours()}:${minutes.padStart(2, "0")}`;


        modal.classList.toggle("early", now < start);
    };

    window.setInterval(check_early , 1000);
    check_early();
})();

(() => {
    const modal = document.getElementById("help_overlay");
    const button = document.getElementById("show_help");

    button.addEventListener("click", () => modal.classList.add("active"));
    modal.addEventListener("click", () => modal.classList.remove("active"));
})();
