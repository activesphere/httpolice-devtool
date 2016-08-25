
import $ from 'jquery';

/* global window */
/* global document */
/* global chrome */

$(document).ready(() => {
  chrome.runtime.sendMessage({ type: 'BEGIN' });
});
