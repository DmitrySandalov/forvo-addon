var contextMenu = require("sdk/context-menu");
var tabs = require("sdk/tabs");
var Request = require("sdk/request").Request;
var prefs = require("sdk/simple-prefs").prefs;

var forvoAPI = 'http://apifree.forvo.com';

// Default values for preferences
var key = decodeKey();
var language = prefs.language;

// Listeners for preference changes
require("sdk/simple-prefs").on("", onPrefChange);
function onPrefChange(prefName) {
    language = prefs.language;
}

// Adds context menu item with handler
var menuItem = contextMenu.Item({
    label: "Pronunciation by Forvo",
    context: contextMenu.SelectionContext(),
    contentScript: 'self.on("click", function () {' +
        '  var text = window.getSelection().toString();' +
        '  self.postMessage(text);' +
        '});',
    onMessage: sayWord
});

function decodeKey() {
    var hxk = '30326565346263303134653732393261' + 
        '33323563323932653963303636353534';
    var result = "";
    for (var i = 0; i < hxk.length; i = i + 2) {
        result += '%' + hxk.substr(i, 2);
    }
    return decodeURI(result);
}

// attaches to active tab and shows an alert
function showMessage(text) {
    tabs.activeTab.attach({
        contentScript: "window.alert('" + text +"')"
    });
}

// Main routine
function sayWord (selectionText) {

    // generates get request URL
    var requestUrl = forvoAPI + 
        '/action/standard-pronunciation' + 
        '/format/json' +
        '/key/' + key +
        '/word/' + selectionText;

    // adds language to URL if set in preferences
    if (language) { 
        requestUrl += '/language/' + language; 
    }

    // launches a request
    Request({
        url: requestUrl,

        onComplete: function (response) {
            resp = response.json;

            // checks that response is not null
            if (!resp) {
                showMessage('Request failed! Check your connection.');
                return;
            }

            // checks that response has items
            if (resp.items.length) {
                var mp3link = resp.items[0].pathmp3;
                require("sdk/page-worker").Page({
                    contentScript: "new Audio('" + mp3link + "').play()"
                });
            } else {
                var message = 'No pronunciations for that at Forvo!';
                if (language) {
                    message += ' (Language: ' + language + ')';
                }
                showMessage(message);
                return;
            }

        }
    }).get();

}
