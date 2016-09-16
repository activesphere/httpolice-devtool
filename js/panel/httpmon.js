/* global chrome */
/* global document */
/* global btoa */
/* global atob */
/* global alert */

import $ from 'jquery';
// import { interactionSetup, installOptions } from './interaction';
import { REMOTE, BITESIZE } from '../defaults.js';
import { visibilityByFlags, getTableRow, clearPage } from '../util.js';
import { interactionSetup } from './interaction.js';

import messages, { hide } from '../messages.js';

import './base.scss';
import './httpmon.scss';

const searchBarSelector = '.control-bar input[type="text"]';

let searchQuery = '';
// let showComments = false;
let showStaticContentReq = true;
let showThirdPartyReq = true;
let recordLogs = false;

const globalExchanges = [];
const metadataIndex = [];

const globalHarLog = {
  log: null,
};

let entriesToProcess = [];
let userRemote = REMOTE;


function handleResponse(initialReq) {
  return (resp) => {
    const jresp = JSON.parse(resp);
    const report = jresp.reports;

    const $sections = $(report).find('section');

    if ($sections.length > 0) {
      let i = 0;
      const len = $sections.length;
      while (i < len) {
        const $sec1 = $($sections[i]);
        const $sec2 = $($sections[i + 1]);
        // Even when the requests fail, they end up in the HAR we get from devtools
        // API. In theses cases, the requests don't have a corresponding responses,
        // so we are going to skip them (the failed requests)
        const consecutiveRequests = !$sec1.find('.StatusCode').length &&
                                    !$sec2.find('.StatusCode').length;

        if (consecutiveRequests) {
          i += 1;
        } else {
          const currentId = globalExchanges.length;
          const $exchng = $(`<div class="exchange" e-index="${currentId}"></div>`);
          const [$request, $response] = $sec2.find('.StatusCode').length ?
                                        [$sec1, $sec2] : [$sec2, $sec1];

          // get some metadata about the request to allow searching, filtering
          const url = $request.find('h2 code span:eq(1)').text();
          const staticContentReq = url.split('/').slice(-1).pop().search(/\./) > -1;
          const thirdPartyReq = !url.startsWith('/');

          metadataIndex.push({
            id: currentId, url, staticContentReq, thirdPartyReq,
          });

          $exchng.append($request)
                 .append('<hr>')
                 .append($response)
                 .append('<hr>');

          const collapsed = $(getTableRow($request.clone(), $response.clone(), currentId));
          const expanded = $exchng;
          globalExchanges.push({
            expanded,
            collapsed,
          });

          // hide shown messages on page (if any)
          hide();
          // apply css rule before inserting
          if (visibilityByFlags(staticContentReq, thirdPartyReq,
                                showStaticContentReq, showThirdPartyReq)) {
            collapsed.css('display', 'table-row');
          } else {
            collapsed.css('display', 'none');
          }
          // also push into the table
          $('tbody').append(collapsed);
        }

        i += 2;
      }
    } // end while
    // Looks like we are done displaying current response
    // Now finish the remaining work (if any)
    if (entriesToProcess.length > 0) {
      eatEntries();
    }
  };
}

function handleError() {
  messages('network-error');
  console.log('hello');
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

function toggleExpandedView(e) {
  e.preventDefault();
  const $item = $(this);
  const state = $item.attr('state');
  const index = $item.attr('index');
  if (state === 'collapsed') {
    const expanded = globalExchanges[Number(index)].expanded;
    expanded.find('section').addClass(`index-${index}`);
    $(this).after(expanded);
    // hook up hovers and stuff from interaction
    interactionSetup(`.index-${index}`);
    $(this).attr('state', 'expanded');
    $(this).find('img').attr('src', 'toggle-up.svg');
  } else {
    $(`div.exchange[e-index="${index}"]`).remove();
    $(this).attr('state', 'collapsed');
    $(this).find('img').attr('src', 'toggle-down.svg');
  }
}

function reloadRows() {
  const idsToShow = metadataIndex.filter(
    val => val.url.search(searchQuery) > -1 &&
         visibilityByFlags(val.staticContentReq, val.thirdPartyReq,
                           showStaticContentReq, showThirdPartyReq)
  ).map(val => val.id);

  $('tr').each(function scroller() {
    const index = Number($(this).attr('index'));
    if (idsToShow.includes(index)) {
      $(this).css('display', 'table-row');
    } else {
      $(this).css('display', 'none');
    }
  });
}

function searchHandler(e) {
  if (e.which === 13) e.preventDefault();
  searchQuery = $(searchBarSelector).val().trim();
  reloadRows();
}

function checkboxHandler() {
  const which = $(this).attr('id');
  if (which === 'static-checkbox') {
    showStaticContentReq = $(this).is(':checked');
  } else if (which === 'third-party-checkbox') {
    showThirdPartyReq = $(this).is(':checked');
  } else if (which === 'request-log-checkbox') {
    recordLogs = $(this).is(':checked');
  }
  reloadRows();
}

$(document).ready(() => {
  restoreRemoteURL();
  listenRemoteURLChanges();

  messages('start');

  // Make a connection to the background script
  const backgroundPageConnection = chrome.runtime.connect({
    name: 'httpmon-devtools-panel',
  });

  backgroundPageConnection.onMessage.addListener((message) => {
    // Handle responses from the background page
    if (message.type === 'BEGIN') {
      if (!recordLogs) clearPage();
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

  chrome.devtools.network.onNavigated.addListener(() => {
    if (!recordLogs) clearPage();
    messages('loading');
    chrome.devtools.network.onRequestFinished
          .removeListener(processIndividualHar);
  });

  backgroundPageConnection.postMessage({
    name: 'init',
    tabId: chrome.devtools.inspectedWindow.tabId,
  });

  // hook up functions to Expand, and Collapse the rows
  $('table').on('click', 'tr', toggleExpandedView);
  // handle Search
  $(searchBarSelector).keydown(searchHandler);
  $('input[type="checkbox"]').change(checkboxHandler);
  $('.clear-page').click(clearPage);
});
