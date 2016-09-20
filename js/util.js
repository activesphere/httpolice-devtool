/* global window */
import $ from 'jquery';

export function randomString() {
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

export function strip(text, type) {
  const TITLE_LIMIT = 97;
  if (text.length > TITLE_LIMIT && type === 'title') {
    return `${text.slice(0, TITLE_LIMIT)}...`;
  }
  return text;
}

const splitByLimit = (title, limit) => {
  if (title.length < limit) {
    return [title, ''];
  }
  return [`${title.slice(0, limit)}...`,
          title.slice(limit)];
};

export function splitByWindowSize(title) {
  const width = $(window).width();

  if (width < 600) {
    return splitByLimit(title, 10);
  } else if (width < 700) {
    return splitByLimit(title, 20);
  } else if (width < 900) {
    return splitByLimit(title, 30);
  } else if (width < 1000) {
    return splitByLimit(title, 40);
  } else if (width < 1200) {
    return splitByLimit(title, 50);
  }
  // anything >1200
  return splitByLimit(title, 70);
}


export function visibilityByFlags(
  staticContentReq, thirdPartyReq, showStaticContentReq, showThirdPartyReq
) {
  return (!staticContentReq && !thirdPartyReq) ||
         (showStaticContentReq &&
          (staticContentReq === showStaticContentReq)) ||
         (showThirdPartyReq &&
          (thirdPartyReq === showThirdPartyReq));
}


export function getTableRow($request, $response, id) {
  const tableRow = $(
    `<tr index="${id}" state="collapsed">
       <th class="head"></th>
       <td class="note"></td>
     </tr>`
  );

  const $target = $request.find('.message-display h2');
  const [cleanTarget, rt] = splitByWindowSize($target.find('code span:eq(1)').text());

  $target.find('code span:eq(1)').text(cleanTarget);
  $target.find('code span:eq(1)').attr('remaining-th', rt);

  tableRow.find('th.head').append($target);
  // the left side of the row
  tableRow.find('td.note')
          .append($request.find('.error h3'))
          .append($response.find('.error h3'))
          .append($request.find('.comment h3'))
          .append($response.find('.comment h3'));
  return tableRow;
}

export function clearPage() {
  $('tr').remove();
  $('.exchange').remove();
  // Hide the messages
  $('.message').css('display', 'none');
}
