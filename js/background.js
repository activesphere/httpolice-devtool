
/* global chrome */

const connections = {};

chrome.runtime.onConnect.addListener((port) => {
  const extensionListener = (message) => {
    // The original connection event doesn't include the tab ID of the
    // DevTools page, so we need to send it explicitly.
    if (message.name === 'init') {
      connections[message.tabId] = port;
      return;
    } else if (message.name === 'INJECT_CONTENT_SCRIPT') {
      // Inject a content script into the identified tab
      chrome.tabs.executeScript(message.tabId,
                                { file: message.scriptToInject });
      return;
    }
  };

  // Listen to messages sent from the DevTools page
  port.onMessage.addListener(extensionListener);

  port.onDisconnect.addListener((portDiscon) => {
    port.onMessage.removeListener(extensionListener);

    const tabs = Object.keys(connections);
    for (let i = 0, len = tabs.length; i < len; i++) {
      if (connections[tabs[i]] === portDiscon) {
        delete connections[tabs[i]];
        break;
      }
    }
  });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener((request, sender) => {
  // Messages from content scripts should have sender.tab set
  if (sender.tab) {
    const tabId = sender.tab.id;
    if (tabId in connections) {
      connections[tabId].postMessage(request);
    } else {
      console.log('Tab not found in connection list.');
    }
  } else {
    console.log('sender.tab not defined.');
  }
  return true;
});
