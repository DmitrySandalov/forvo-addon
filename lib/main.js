// Defines add-on preferences
var prefs = require("sdk/simple-prefs").prefs;
var key = decodeKey();
var language = prefs.language;
require("sdk/simple-prefs").on("", onPrefChange);
function onPrefChange(prefName) {
    language = prefs.language;
}

// Adds context menu item
var contextMenu = require("sdk/context-menu");
var menuItem = contextMenu.Item({
    label: "Pronunciation by Forvo",
    context: contextMenu.SelectionContext(),
    contentScript: 'self.on("click", function () {' +
        '  var text = window.getSelection().toString();' +
        '  self.postMessage(text);' +
        '});',
    onMessage: fetchAudio
});

// page-worker for playing audio
var pageWorker = require("sdk/page-worker").Page({
    contentScript:
        "self.port.on('message', function(link){ " +
        "   new Audio(link).play();" +
        "});"
});

// Requests the audio from Forvo.com
var forvoAPI = 'http://apifree.forvo.com';
var request = require("sdk/request").Request;

function fetchAudio(selectionText) {
    // URL request string builder
    var requestUrl = forvoAPI + 
        '/action/standard-pronunciation' + 
        '/format/json' +
        '/key/' + key +
        '/word/' + selectionText;

    // adds language to URL if set in preferences
    if (language) { 
        requestUrl += '/language/' + language; 
    }

    // Fires a request, plays audio on completion
    request({url: requestUrl, onComplete: sayWord}).get();
}

// Parses response and plays audio
function sayWord(response) {
    resp = response.json;

    // checks that response is not null
    if (!resp) {
        showMessage('Request failed! Check your connection.');
        return;
    }

    // checks that response has items
    if (resp.items.length) {
        var mp3link = resp.items[0].pathmp3;
        pageWorker.port.emit("message", mp3link);
    } else {
        showMessage('No pronunciations found for selection');
        return;
    }
}

// Util: show an alert
var tabs = require("sdk/tabs");
function showMessage(text) {
    tabs.activeTab.attach({
        contentScript: "window.alert('" + text +"')"
    });
}

// Util: API key deobfuscation
function decodeKey() {
    var hxk = '30326565346263303134653732393261' +
        '33323563323932653963303636353534';
    var result = "";
    for (var i = 0; i < hxk.length; i = i + 2) {
        result += '%' + hxk.substr(i, 2);
    }
    return decodeURI(result);
}
