
import { REMOTE } from './defaults.js';

/* global chrome document */

// shows a simple status message
function showStatus(now, later) {
  // Update status to let user know options were saved.
  const status = document.getElementById('status');
  status.textContent = now;
  setTimeout(() => {
    status.textContent = later;
  }, 750);
}

// Saves options to chrome.storage.sync.
function saveOptions() {
  const remote = document.getElementById('remote').value;
  chrome.storage.sync.set({
    remote,
  }, () => {
    showStatus('Options saved.', '');
  });
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  chrome.storage.sync.get({
    remote: REMOTE,
  }, (items) => {
    document.getElementById('remote').value = items.remote;
  });
}

// restores default values
function restoreDefaultValues() {
  chrome.storage.sync.set({
    remote: REMOTE,
  }, () => {
    showStatus('Options restored.', '');
    document.getElementById('remote').value = REMOTE;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
document.getElementById('restore').addEventListener('click',
                                                    restoreDefaultValues);
