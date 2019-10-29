// KINKIP algo

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

function Kinpik () {
    this.results = {};
    this.chars = [];
}

Kinpik.prototype.setChars = function (text) {
    this.results = {};
    this.chars = Array.from (text).filter (ch => ! /\s/.test (ch)).map (ch => ch.toLowerCase ());
    return this;
}

Kinpik.prototype.charsLength = function () {
    return this.chars.length;
}

Kinpik.prototype.addIf = function (word) {
    if (match_chars (word, this.chars)) {
        this.results [word] = true;
    }
}

Kinpik.prototype.html = function () {
    let _html = "<h2>Výsledek</h2><pre>\n";
    Object.keys (this.results).forEach (function (key) {
        //console.log (key);
        _html += "    " + key + "\n";
    });
    _html += "</pre>";
    return _html;
}

// New object based interafce
var kp = new Kinpik ();

// initialize worker
var worker = new Worker("/js/worker.sql.js"); // You can find worker.sql.js in this repo
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
            let word = value [0];
            kp.addIf (word);
        }
    }

    $("#result").html (kp.html ());
}

// GET database and enable button if OK
var xhr = new XMLHttpRequest();
xhr.open('GET', '/en-cs.sqlite', true);
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

    kp.setChars ($("#characters").val ());
    if (kp.charsLength () < 3) {
        return;
    }

    id++;
    worker.postMessage ({
        id: id,
        action: 'exec',
        sql: 'SELECT cz from dct WHERE LENGTH (cz) >= 2 AND LENGTH (cz) <= ' + kp.charsLength () + ' ORDER BY LENGTH (cz) DESC'
    });
});
