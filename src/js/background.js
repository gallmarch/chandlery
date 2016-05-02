// MESSAGE LISTENERS

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  switch (message.command) {
    case "notify":
      var notifications = [];
      var actions = message.actions;
      var cards = message.cards;
      chrome.storage.local.get(null, function(options) {
        if (options.notifyActionsFull && actions.known && actions.full) {
          notifications.push({
            type: "actionsFull",
            count: actions.current,
            stale: options.lastKnown.actions.full
          });
        }
        if (options.notifyCardsFull && cards.known && cards.full) {
          notifications.push({
            type: "cardsFull",
            count: cards.current,
            stale: options.lastKnown.cards.full
          });
        }
        showNotification(notifications);

        var lastKnown = options.lastKnown;
        if (actions.known) {
          lastKnown.actions = actions;
        }
        if (cards.known) {
          lastKnown.cards = cards;
        }

        chrome.storage.local.set({lastKnown: lastKnown});
      });
      break;
  }
});

// INSTALL/UPDATE HANDLING

function reinjectContentScripts() {
  var contentScripts = ["js/lib/mutation-summary.js", "js/content.js"];

  function silenceErrors() {
    if (chrome.runtime.lastError) { return; } // Silence access errors for reinjection
  }

  chrome.tabs.query({}, function(tabs) {
    tabs.forEach(function(tab) {
      for (let file of contentScripts) {
        chrome.tabs.executeScript(tab.id, {file: file}, silenceErrors);
      }
    });
  });
}

chrome.runtime.onInstalled.addListener(function() {
  var defaults = {
    notifyActionsFull: true,
    notifyCardsFull: false,
    syncOverride: false,
    lastKnown: {
      actions: {},
      cards: {}
    }
  };

  chrome.storage.local.get(defaults, function(options) {
    chrome.storage.local.set(options, function() {
      // Try to reinject into all open FL tabs
      reinjectContentScripts();
    });
  });
});
