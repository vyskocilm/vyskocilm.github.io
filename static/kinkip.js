// KINKIP algo

// array to store result
var RESULTS = {};
// array to store characters
var CHARS = [];

// return true if word contains all characters from chars
function match_chars (word, _chars) {
    var chars = _chars.slice ();
    for (let wch of word) {
        var index = chars.indexOf (wch);
        if (index == -1) {
            return false;
        }
        chars.splice (index, 1);
    }

    return true;
}

// initialize worker
var worker = new Worker("/static/worker.sql.js"); // You can find worker.sql.js in this repo
worker.onerror = error;
worker.onmessage = sql_result;

function error (e) {
    console.log (e);
    $("#result").html (e);
}

function sql_result (event) {
    // id == 1 -> database open
    if (event.data.id == 1) {
        console.log (event);
        return;
    }

    for (let result of event.data.results) {
        for (let value of result.values) {
            var word = value [0];
            if (match_chars (word, CHARS)) {
                RESULTS [word] = true;
            }
        }
    }

    console.log (RESULTS);
    var k;
    var _html = "<h2>Výsledek</h2><pre>\n";
    Object.keys (RESULTS).forEach (function (key) {
        //console.log (key);
        _html += "    " + key + "\n";
    });
    _html += "</pre>";
    $("#result").html (_html);
}

// GET database and enable button if OK
var xhr = new XMLHttpRequest();
xhr.open('GET', '/static/en-cs.sqlite', true);
xhr.responseType = 'arraybuffer';

// sql.js part
var id = 1;
xhr.onload = function(e) {
    console.log ("GET en-cs.sqlite");
    $("#ready").html ("Databázový soubor en-cs.sqlite nahrán, inicializuji databázi");
    var uInt8Array = new Uint8Array (this.response);
    worker.postMessage({
        id:id,
        action:'open',
        buffer: uInt8Array,
    });
    console.log ("worker.<open>");
    $("#ready").html ("Databázový soubor en-cs.sqlite nahrán, databáze inicializována");
    $("#execute").removeAttr ("disabled");
}
xhr.send();

$("#execute").click (function () {
    // here will be the major functionality, righ now push some random query

    console.log ("#execute.click ()");
    CHARS = $("#characters").val ().split (/\s+/);
    if (CHARS.length < 3) {
        return;
    }

    RESULTS = {};
    id++;
    worker.postMessage ({
        id: id,
        action: 'exec',
        sql: 'SELECT cz from dct WHERE LENGTH (cz) >= 2 AND LENGTH (cz) <= ' + CHARS.length + ' ORDER BY LENGTH (cz) DESC'
    });
});
