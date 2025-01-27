require("./filter.js");
import { start } from "./websocket"; // Import our websocket handler
import "../scss/main.scss"; // Import SCSS
import '@jamescoyle/svg-icon'
var pointInPolygon = require('point-in-polygon');
var detail = require("./loadDetail");
function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
};
var BASE_URL = "https://api-staging.anolet.com";
window.BASE_URL = BASE_URL;

function closeSelf() {
    try { ws.ws.close(); } catch (e) { } // Still close window even if websocket is not connected
    window.top.postMessage('disconnect', '*')
}
window.closeSelf = closeSelf;
// document.addEventListener('contextmenu', event => event.preventDefault());
var gameid = new URLSearchParams(window.location.search).get("game");

// This prevents "changes you made may not be saved" popup
window.onbeforeunload = function () { return null }

detail("Getting game information")
axios.get(window.BASE_URL + "/game/" + gameid).then((res) => {
    detail("Processing game information")
    document.getElementById("load-name").innerText = res.data.title;
    document.getElementById("load-author").innerText = res.data.creator.name;
    document.getElementById("load-image").src = res.data.iconAssetURL;

    detail("Beginning websocket processor");
    start(gameid).then(wsresp => {
        detail("Tidying up");
        var ws = wsresp;

        const Stats = require('stats.js');
        var stats = new Stats();
        stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
        stats.dom.style.removeProperty("top")
        stats.dom.style.removeProperty("left")
        stats.dom.style.bottom = "0";
        stats.dom.style.right = "0";
        stats.dom.id = "stats";
        document.body.appendChild(stats.dom);

        function animate() {

            stats.begin();

            // monitored code goes here

            stats.end();

            requestAnimationFrame(animate);

        }

        requestAnimationFrame(animate);


        // Ran by MouseClick Event
        function moved(event) {
            let allowed = true;
            document.currentZone.boundaryPolylines.forEach((boundary, index) => {
                if (pointInPolygon([percentage(event.clientX, window.innerWidth), percentage(event.clientY, window.innerHeight)], boundary)) {
                    return allowed = false;
                }
                if (index == document.currentZone.boundaryPolylines.length - 1 && allowed) {
                    ws.ws.send(JSON.stringify({
                        type: "pos",
                        x: percentage(event.clientX, window.innerWidth),
                        y: percentage(event.clientY, window.innerHeight)
                    }));
                }
            });
        }

        // Ran when chat is sent
        function chat(event, el) {
            if (event.which == 13) {
                if (event.target.value.length > 150 || event.target.value.length < 2) return;
                ws.ws.send(JSON.stringify({
                    type: "chat",
                    message: event.target.value
                }));
                el.disabled = true;
                var timeLeft = 1;
                el.placeholder = "Please wait 1 second...";
                var timeout = setInterval(() => {
                    timeLeft--;
                    el.placeholder = "Please wait " + timeLeft + " second...";
                    if (timeLeft == 0) {
                        el.placeholder = "Send a chat message";
                        el.disabled = false
                    }
                }, 1000);
                setTimeout(function () { clearInterval(timeout) }, 1000);
                setTimeout(function () {
                    el.placeholder = "Send a chat message";
                    el.disabled = false
                }, 1000); // bandaid solution
                el.value = "";
            }
        };
        window.chat = chat;

        function kick(id) {
            ws.ws.send(JSON.stringify({
                type: "kick",
                id: id.substring(7)
            }));
        }
        window.kick = kick;


        function tab(evt, tabName) {
            var i, tabcontent, tablinks;
            tabcontent = document.getElementsByClassName("tabcontent");
            for (i = 0; i < tabcontent.length; i++) {
                tabcontent[i].style.display = "none";
            }
            tablinks = document.getElementsByClassName("tab");
            for (i = 0; i < tablinks.length; i++) {
                tablinks[i].className = tablinks[i].className.replace(" active", "");
            }
            document.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }
        window.tab = tab;

        detail("Adding Event Listeners");
        // Assign the move event to when the mouse is clicked
        document.getElementById("game").addEventListener("click", moved);

        document.getElementById("chat_toggle").addEventListener("click", function () {
            if (document.getElementById("chat").style.opacity == "0") {
                document.getElementById("chat").style["display"] = "block";
                document.getElementById("chat").style["z-index"] = "1";
                document.getElementById("chat").style.opacity = "1";
                document.getElementById("chat_toggle").style.filter = "invert(1)";
            } else {
                setTimeout(function () {
                    document.getElementById("chat").style["z-index"] = "-1";
                    document.getElementById("chat").style["display"] = "none";
                }, 200);
                document.getElementById("chat").style.opacity = "0";
                document.getElementById("chat_toggle").style.filter = "invert(0)";
            }
        });

        document.getElementById("list_toggle").addEventListener("click", function () {
            if (document.getElementById("list").style.opacity == "0") {
                document.getElementById("list").style["display"] = "block";
                document.getElementById("list").style["z-index"] = "1";
                document.getElementById("list").style.opacity = "1";
                document.getElementById("list_toggle").style.filter = "invert(1)";
            } else {
                setTimeout(function () {
                    document.getElementById("list").style["z-index"] = "-1";
                    document.getElementById("list").style["display"] = "none";
                }, 200);
                document.getElementById("list").style.opacity = "0";
                document.getElementById("list_toggle").style.filter = "invert(0)";
            }
        });


        document.getElementById("menu_toggle").addEventListener("click", function () {
            if (document.getElementById("menu").style.opacity == "0") {
                document.getElementById("menu").style["z-index"] = "0";
                document.getElementById("menu").style.opacity = "1";
                document.getElementById("menu_toggle").style.filter = "invert(1)";
            } else {
                setTimeout(function () {
                    document.getElementById("menu").style["z-index"] = "-1";
                }, 200);
                document.getElementById("menu").style.opacity = "0";
                document.getElementById("menu_toggle").style.filter = "invert(0)";
            }
        });

        document.getElementById("debug_toggle").addEventListener("click", function () {
            if (document.getElementById("stats").style.opacity == "0") {
                document.getElementById("stats").style["display"] = "block";
                document.getElementById("stats").style["z-index"] = "0";
                document.getElementById("stats").style.opacity = "1";
                document.getElementById("debug_toggle").style.filter = "invert(1)";
            } else {
                setTimeout(function () {
                    document.getElementById("stats").style["z-index"] = "-1";
                    document.getElementById("stats").style["display"] = "none";
                }, 200);
                document.getElementById("stats").style.opacity = "0";
                document.getElementById("debug_toggle").style.filter = "invert(0)";
            }
        });

        document.getElementById("menu_close").addEventListener("click", function () {
            setTimeout(function () {
                document.getElementById("menu").style["z-index"] = "-1";
            }, 200);
            document.getElementById("menu").style.opacity = "0";
            document.getElementById("menu_toggle").style.filter = "invert(0)";
        });

        // Focus the chatbox when the user presses "/"
        document.addEventListener("keydown", function (event) {
            if (event.key == "/") {
                event.preventDefault();
                document.getElementById("chatbox").focus();
            } else if (event.key === "Escape") {
                if (document.getElementById("menu").style.opacity == "1") {
                    setTimeout(function () {
                        document.getElementById("menu").style["z-index"] = "-1";
                    }, 200);
                    document.getElementById("menu").style.opacity = "0";
                    document.getElementById("menu_toggle").style.filter = "invert(0)";
                } else {
                    document.getElementById("menu").style["z-index"] = "0";
                    document.getElementById("menu").style.opacity = "1";
                    document.getElementById("menu_toggle").style.filter = "invert(1)";
                }
            }
        });

        detail("Waiting On Assets To Load");
        Promise.all(Array.from(document.images).filter(img => !img.complete).map(img => new Promise(resolve => { img.onload = img.onerror = resolve; }))).then(() => {
            detail("Assets Loaded");
            document.getElementById("loading").style.opacity = "0"
            setTimeout(function () {
                document.getElementById("loading").style.display = "none"
            }, 800);
            // begin running game specific code
            require("./sandboxedCode.js");
        });
    });
});
