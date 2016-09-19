
import { REMOTE } from '../defaults.js';

/* global  chrome */

function restoreRemoteURL(server) {
  // Set userRemote to user defined value
  chrome.storage.sync.get({
    remote: REMOTE,
  }, (items) => {
    server.userRemote = items.remote;
  });
}

function listenRemoteURLChanges(server) {
  chrome.storage.onChanged.addListener((changes) => {
    if ({}.hasOwnProperty.call(changes, 'remote')) {
      const oldVal = changes.remote.oldValue;
      const newVal = changes.remote.newValue;
      server.userRemote = oldVal === newVal ? oldVal : newVal;
    }
  });
}

export default function initStorage(server) {
  restoreRemoteURL(server);
  listenRemoteURLChanges(server);
}
