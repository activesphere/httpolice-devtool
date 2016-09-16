
/* Handles displaying for status, error messages */
import $ from 'jquery';

export function hide() {
  $('.message').css('display', 'none');
}

function show() {
  $('.message').css('display', 'block');
}

function toMessage(htmlText) {
  $('.message').html(htmlText);
  show();
}

export default function messages(code) {
  // handle various kinds
  if (code === 'start') {
    toMessage(`<p>Hit <strong>Refresh</strong> to start recording
          the network activity</p>`);
  } else if (code === 'loading') {
    /* show only if there is nothing in the page */
    if (!$('tr').length > 0) {
      toMessage('<p>Loading...</p>');
    } else {
      // make sure it's hidden
      hide();
    }
  } else if (code === 'network-error') {
    toMessage(`<p>Network Error<p>
               <p>Make sure the <strong>server is running</strong>
               and the <strong>address is correct</strong>.</p>`);
  }
}
