const ft = require("./fulltilt.min.js");
const gl = require("gl-matrix");
const Sender = require("./sender");
const Button = require("./Button");

let log = document.getElementById("log");
let xbox = document.getElementById("xcoord");
let ybox = document.getElementById("ycoord");

let showCoords = (x, y) => {
    xbox.innerText = x;
    ybox.innerText = y;
};

let range = [0.5, 0.5];
let resolution = [1920, 1080];
 
let zeroframe = null;
window.resetPosition = () => {
    zeroframe = null;
};

let sender = new Sender("ws://beatrix.informatik.rwth-aachen.de:7777");  
//let sender = new Sender("ws://brundtland:50000");  
//let sender = new Sender("ws://herzog.informatik.rwth-aachen.de:50000");
sender.addPermanentProps({id: Math.floor((1 + Math.random()) * 0x10000)});

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

        showCoords(x,y);
        sender.send({x: Math.round(x), y: Math.round(y)});
    });
};

//openSocket();
window.setInterval(updateOrientation, 30);

window.addEventListener("load",function() {
    setTimeout(function(){
        // This hides the address bar:
        window.scrollTo(0, 1);
    }, 0);
});

new Button.ClickButton(document.getElementById("reset"), resetPosition);
let pens = document.querySelectorAll("#penbox .draw");
for (let pen of pens) {
    console.log("Pen:")
    console.debug(pen);
    new Button.HoldButton(pen, () => {
        sender.addTemporaryProps({"active": true, "style": pen.dataset.type});
    }, () => {
        sender.addTemporaryProps({"active": false});
    });
}


/*let toucharea = document.getElementById("drawtouch");
toucharea.addEventListener("touchstart", () => {
    toucharea.classList.add("touched");
    sender.addTemporaryProps({"active": true});
});
toucharea.addEventListener("touchend", () => {
    toucharea.classList.remove("touched");
    sender.addTemporaryProps({"active": false});
});*/

let colors = ['#00549F', '#006165', '#0098A1', '#57AB27', '#BDCD00', '#F6A800', '#CC071E', '#A11035', '#612158', '#7A6FAC', '#E30066', '#FFED00'];
let firstColor = Math.floor(Math.random() * colors.length);
let rows = document.querySelectorAll('#colorbox .row');
for (let i = 0; i < colors.length; i++) {
    let check = document.createElement("input");
    check.type = "radio";
    check.name = "color";
    check.id = "color-" +i;

    let label = document.createElement("label");
    label.htmlFor = check.id;
    label.style.backgroundColor = colors[i];
    label.className = "colorbutton";

    let row = rows[Math.floor(i / 4)];
    row.appendChild(check);
    row.appendChild(label);

    label.addEventListener("click", () => {
        sender.addTemporaryProps({color: colors[i]});
        console.log("Select color " + colors[i]);
    });

    if (i == firstColor) label.click();
}
