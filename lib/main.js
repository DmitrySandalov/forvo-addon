var contextMenu = require("sdk/context-menu");
var tabs = require("sdk/tabs");
var Request = require("sdk/request").Request;
var prefs = require("sdk/simple-prefs").prefs;

var forvoAPI = 'http://apifree.forvo.com';

// Default values for preferences
var key = prefs.apiKey;
var language = prefs.language;

// Listeners for preference changes
require("sdk/simple-prefs").on("", onPrefChange);
function onPrefChange(prefName) {
    key = prefs.apiKey;
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

// Main routine
function sayWord (selectionText) {

    // generates get request URL
    var requestUrl = forvoAPI + 
        '/action/standard-pronunciation' + 
        '/format/json' +
        '/word/' + selectionText;

    // checks that API key is correct
    if (key) { 
        requestUrl += '/key/' + key;
    } else {
        tabs.activeTab.attach({
            contentScript: "window.alert('Request failed! Check your API key in preferences.')"
        });
        return;
    }

    // adds language to URL if set
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
                tabs.activeTab.attach({
                    contentScript: "window.alert('Request failed! Check your connection.')"
                });
                return;
            }

            // checks that response has items
            if (resp.items.length) {
                var mp3link = resp.items[0].pathmp3;
                require("sdk/page-worker").Page({
                    contentScript: "new Audio('" + mp3link + "').play()"
                });
            } else {
                tabs.activeTab.attach({
                    contentScript: "window.alert('No pronunciations at Forvo! Check language in preferences.')"
                });
            }

        }
    }).get();

}
