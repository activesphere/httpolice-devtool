/* global chrome */
/* global document */
/* global btoa */
/* global atob */
/* global alert */

import $ from 'jquery';
import { interactionSetup, installOptions } from './interaction';

const globalHarLog = {
  log: null,
};

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

    if (initialReq) {
      $('body').html(report);
      interactionSetup('section');
      installOptions();
    } else {
      const exchng = $('<div class="exchange"></div>');
      const targetElems = $(report).find('section')
                                   .addClass(randomClass)
                                   .append($('<hr>'));
      $('body').append(exchng.append(targetElems));
      interactionSetup(`section.${randomClass}`);
    }
  };
}

function handleError(response) {
  // TODO show warnings!
  console.log(`${response.status} : ${response.statusText}`);
}

function processIndividualHar(req, initial = false) {
  // get a report for this request.
  let payload = {};
  if (initial) {
    globalHarLog.log = req;
    payload = btoa(JSON.stringify(globalHarLog));
  } else {
    const harEntry = { ...globalHarLog };
    harEntry.log.entries = [req];
    payload = btoa(JSON.stringify(harEntry));
  }

  $.ajax({
    url: 'http://localhost:8080/har',
    type: 'POST',
    data: { payload },
    success: handleResponse(initial),
    error: handleError,
  });
}

$(document).ready(() => {
  // Make a connection to the background script
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'httpmon-devtools-panel',
  });

  backgroundPageConnection.onMessage.addListener((message) => {
    // Handle responses from the background page
    if (message.type === 'BEGIN') {
      $('.exchange').remove();
      chrome.devtools.network.getHAR((harLog) => {
        globalHarLog.log = harLog;
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
