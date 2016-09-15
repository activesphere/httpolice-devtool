
/* Handles displaying for status, error messages */
import $ from 'jquery';

function show(htmlText) {
  $('.message').html(htmlText);
}

export default function messages(code) {
  // make sure the thing is visible
  $('.message').css('display', 'block');
  // handle various kinds
  if (code === 'start') {
    show(`<p>Hit <strong>Refresh</strong> to start recording
          the network activity</p>`);
  } else if (code === 'loading') {
    show('<p>Loading...</p>');
  } else if (code === 'network-error') {
    show(`<p>Network Error<p>
          <p>Make sure the <strong>server is running</strong>
             and the <strong>address is correct</strong>.</p>`);
  }
}
