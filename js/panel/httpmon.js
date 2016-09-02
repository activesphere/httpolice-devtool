/* global chrome */
/* global document */
/* global btoa */
/* global atob */
/* global alert */

import $ from 'jquery';
// import { interactionSetup, installOptions } from './interaction';
import { REMOTE, BITESIZE } from '../defaults.js';

import './base.scss';
import './httpmon.scss';

const searchBarSelector = '.control-bar input[type="text"]';

let searchQuery = '';
// let showComments = false;
let showStaticContentReq = true;
let showThirdPartyReq = true;

const globalExchanges = [];
const metadataIndex = [];

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

function strip(text, type) {
  const TITLE_LIMIT = 97;
  if (text.length > TITLE_LIMIT && type === 'title') {
    return `${text.slice(0, TITLE_LIMIT)}...`;
  }
  return text;
}

function getTableRow($request, $response, id) {
  const tableRow = $(
    `<tr index="${id}" state="collapsed">
       <th></th>
       <td></td>
     </tr>`
  );

  const $target = $request.find('.message-display h2');
  const cleanTarget = strip($target.find('code span:eq(1)').text(), 'title');

  $target.find('code span:eq(1)').text(cleanTarget);

  tableRow.find('th').append($target);
  // the left side of the row
  tableRow.find('td')
          .append($request.find('.error h3'))
          .append($response.find('.error h3'))
          .append($request.find('.comment h3'))
          .append($response.find('.comment h3'));
  return tableRow;
}

function visibilityByFlags(staticContentReq, thirdPartyReq) {
  return (!staticContentReq && !thirdPartyReq) ||
         staticContentReq === showStaticContentReq ||
         thirdPartyReq === showThirdPartyReq;
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
      for (let i = 0, len = $sections.length; i < len; i += 2) {
        const currentId = globalExchanges.length;
        const $exchng = $(`<div class="exchange" e-index="${currentId}"></div>`);
        const $request = $($sections[i]);
        const $response = $($sections[i + 1]);

        // get some metadata about the request to allow searching, filtering
        const url = $request.find('h2 code span:eq(1)').text();
        const staticContentReq = url.split('/').slice(-1).pop().search(/\./) > -1;
        const thirdPartyReq = !url.startsWith('/');

        metadataIndex.push({
          id: currentId, url, staticContentReq, thirdPartyReq,
        });

        $exchng.append($request.addClass(randomClass))
               .append('<hr>')
               .append($response.addClass(randomClass))
               .append('<hr>');

        const collapsed = $(getTableRow($request.clone(), $response.clone(), currentId));
        const expanded = $exchng;
        globalExchanges.push({
          expanded,
          collapsed,
        });

        // apply css rule before inserting
        if (visibilityByFlags(staticContentReq, thirdPartyReq)) {
          collapsed.css('display', 'table-row');
        } else {
          collapsed.css('display', 'none');
        }
        // also push into the table
        $('tbody').append(collapsed);
      }

      if ($('.options').length === 0) {
        // installOptions();
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

function toggleExpandedView(e) {
  e.preventDefault();
  const $item = $(this);
  const state = $item.attr('state');
  const index = $item.attr('index');
  if (state === 'collapsed') {
    const expanded = globalExchanges[Number(index)].expanded;
    $(this).after(expanded);
    $(this).attr('state', 'expanded');
  } else {
    $(`div.exchange[e-index="${index}"]`).remove();
    $(this).attr('state', 'collapsed');
  }
}

function reloadRows() {
  const idsToShow = metadataIndex.filter(
    val => val.url.search(searchQuery) > -1 &&
         visibilityByFlags(val.staticContentReq, val.thirdPartyReq)
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
  /* if (which === 'comments-checkbox') {
   *   showComments = $(this).is(':checked');
   * }*/
  if (which === 'static-checkbox') {
    showStaticContentReq = $(this).is(':checked');
  } else if (which === 'third-party-checkbox') {
    showThirdPartyReq = $(this).is(':checked');
  }
  reloadRows();
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

  // hook up functions to Expand, and Collapse the rows
  $('table').on('click', 'tr', toggleExpandedView);
  // handle Search
  $(searchBarSelector).keydown(searchHandler);
  $('input[type="checkbox"]').change(checkboxHandler);
});
