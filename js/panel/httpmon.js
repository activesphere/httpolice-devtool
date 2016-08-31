/* global chrome */
/* global document */
/* global btoa */
/* global atob */
/* global alert */

import $ from 'jquery';
import { interactionSetup, installOptions } from './interaction';
import { REMOTE, BITESIZE } from '../defaults.js';

import './httpmon.scss';

const globalHarLog = {
  log: null,
};
let entriesToProcess = [];
let userRemote = REMOTE;

function randomString() {
  const getRandomNum = (min, max) =>
    Math.floor(Math.random() * ((max - min) + 1)) + min;

  const length = getRandomNum(10, 14);
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  let chars = [];

  for (let i = 0; i < length; i++) {
    chars = [
      ...chars,
      possible.charAt(Math.floor(Math.random() * possible.length)),
    ];
  }
  return chars.join('');
}

function handleResponse(initialReq) {
  return (resp) => {
    const jresp = JSON.parse(resp);
    const report = jresp.reports;
    const randomClass = randomString();

    const $sections = $(report).find('section');
    if (initialReq) {
      // clean old junk
      $('.exchange').remove();
    }

    if ($sections.length > 0) {
      const $targetElems = [];
      for (let i = 0, len = $sections.length; i < len; i += 2) {
        const $exchng = $('<div class="exchange"></div>');
        $exchng.append($sections[i]);
        $exchng.append('<hr>');
        $exchng.append($sections[i + 1]);
        $exchng.append('<hr>');
        $targetElems.push($exchng);
      }

      $('body').append($targetElems);
      interactionSetup(`section.${randomClass}`);

      if ($('.options').length === 0) {
        installOptions();
      }
    }
    // Looks like we are done displaying current response
    // Now finish the remaining work (if any)
    if (entriesToProcess.length > 0) {
      eatEntries();
    }
  };
}

function handleError(response) {
  // TODO show warnings!
  console.log(`${response.status} : ${response.statusText}`);
}

function getChecked(payload, initial = false) {
  $.ajax({
    url: userRemote,
    type: 'POST',
    data: { payload },
    success: handleResponse(initial),
    error: handleError,
  });
}

function eatEntries() {
  // This removes a BITESIZEd chunk from entriesToProcess
  const chunk = entriesToProcess.splice(0, BITESIZE);
  const harEntry = { ...globalHarLog };
  harEntry.log.entries = chunk;
  const payload = btoa(JSON.stringify(harEntry));
  getChecked(payload);
}

function feedEntries(newEntries) {
  entriesToProcess = entriesToProcess.concat(newEntries);
}

function processIndividualHar(req, initial = false) {
  // get a report for this request.
  let payload = {};
  if (initial) {
    globalHarLog.log = { ...req };
    payload = btoa(JSON.stringify(globalHarLog));
  } else if (entriesToProcess.length === 0) {
    // means we've finished all work, and ready to roll!
    const harEntry = { ...globalHarLog };
    harEntry.log.entries = [req];
    payload = btoa(JSON.stringify(harEntry));
  } else {
    // There still some pending work. Dump this over the same pile
    // and do nothing.
    feedEntries([req]);
    return;
  }
  getChecked(payload, initial);
}

function restoreRemoteURL() {
  // Set userRemote to user defined value
  chrome.storage.sync.get({
    remote: REMOTE,
  }, (items) => {
    userRemote = items.remote;
  });
}

function listenRemoteURLChanges() {
  chrome.storage.onChanged.addListener((changes) => {
    if ({}.hasOwnProperty.call(changes, 'remote')) {
      const oldVal = changes.remote.oldValue;
      const newVal = changes.remote.newValue;
      userRemote = oldVal === newVal ? oldVal : newVal;
    }
  });
}

$(document).ready(() => {
  restoreRemoteURL();
  listenRemoteURLChanges();

  // Make a connection to the background script
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'httpmon-devtools-panel',
  });

  backgroundPageConnection.onMessage.addListener((message) => {
    // Handle responses from the background page
    if (message.type === 'BEGIN') {
      $('.exchange').remove();
      chrome.devtools.network.getHAR((harLog) => {
        entriesToProcess = harLog.entries.slice(5);
        harLog.entries = harLog.entries.slice(0, 5);
        // strip
        processIndividualHar(harLog, true);
        chrome.devtools.network
              .onRequestFinished.addListener(processIndividualHar);
      });
    }
  });

  backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });
});
