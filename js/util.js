
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
