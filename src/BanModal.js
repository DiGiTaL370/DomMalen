const Timer = require("./Timer");

function pretty_time(seconds) {
    if (seconds == 1) return `eine Sekunde`;
    if (seconds < 60) return `${seconds} Sekunden`;

    let mins = Math.floor(seconds / 60);
    let secs = seconds % 60;
    if (secs == 1) return `${mins} Minuten und eine Sekunde`;
    return `${mins} Minuten und ${secs} Sekunden`;
}

module.exports = function(element) {
    reset_seconds = 0;
    reset_timestamp = new Date().getTime();
    tick_timer = new Timer(tick, 1000);

    function tick() {
        time_left = (reset_seconds * 1000) + reset_timestamp - new Date().getTime();
        time_left /= 1000;

        if (time_left > 0) {
            element.querySelector(".rest").innerText = pretty_time(Math.round(time_left));
            element.querySelector(".progress_inner").style.width = `${100 * time_left / reset_seconds}%`;
            time_left--;
        } else {
            tick_timer.stop();
        }
    }

    return {
        setTime: function(time) {
            time_left = (reset_seconds * 1000) + reset_timestamp - new Date().getTime();
            time_left /= 1000;

            if (time > time_left + 30) {
                reset_seconds = time;
                reset_timestamp = new Date().getTime();
            } else {
                reset_seconds += time - time_left;
            }

            tick();
            tick_timer.start();
        },

        setQueuePos: function(pos) {
            element.querySelector(".queue").innerText = "" + pos;
        },

        show: function() {
            element.classList.add("active");
        },

        hide: function() {
            element.classList.remove("active");
        }
    };
};
