import $ from 'jquery';
import { visibilityByFlags, splitByWindowSize } from '../util.js';

/* global document window */

export function reloadRows(
  metadataIndex, searchQuery, showStaticContentReq, showThirdPartyReq
) {
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

export function checkboxHandler() {
  const showStaticContentReq = $('#static-checkbox').is(':checked');
  const showThirdPartyReq = $('#third-party-checkbox').is(':checked');
  const recordLogs = $('#request-log-checkbox').is(':checked');
  return {
    showStaticContentReq,
    showThirdPartyReq,
    recordLogs,
  };
}

export function searchHandler(e) {
  if (e.which === 13) e.preventDefault();
  return $(e).val().trim();
}

export function toggleExpandedView(globalExchanges, interactionSetup) {
  return (e) => {
    e.preventDefault();
    const $target = $(e.currentTarget);
    const state = $target.attr('state');
    const index = $target.attr('index');
    if (state === 'collapsed') {
      const expanded = globalExchanges[Number(index)].expanded;
      expanded.find('section').addClass(`index-${index}`);
      $target.after(expanded);
      // hook up hovers and stuff from interaction
      interactionSetup(`.index-${index}`);
      $target.attr('state', 'expanded');
      $target.find('img').attr('src', 'toggle-up.svg');
    } else {
      $(`div.exchange[e-index="${index}"]`).remove();
      $target.attr('state', 'collapsed');
      $target.find('img').attr('src', 'toggle-down.svg');
    }
  };
}

function deSelectRow() {
  // remove any exchanges if already present
  $('div.exchange').remove();
  // (de)select row (if there's one already selected)
  $('.selected-row').removeClass('selected-row');
}

function removeExpandedView() {
  $(this).parents('div.exchange').remove();
  deSelectRow();
}

export function addSidebar(globalExchanges, interactionSetup) {
  return (e) => {
    e.preventDefault();
    const $target = $(e.currentTarget);
    const index = $target.attr('index');
    if (!$target.hasClass('selected-row')) {
      // so this is a different row
      deSelectRow();
      $target.addClass('selected-row');
      // now add the exchange that belongs to this row
      const expanded = globalExchanges[Number(index)].expanded;
      expanded.find('section').addClass(`index-${index}`);
      $target.after(expanded);
      // hook up hovers and stuff from interaction
      interactionSetup(`.index-${index}`);
      $('button.ex-cls').click(removeExpandedView);
    }
  };
}

export function resizeRowHead() {
  $('tr').each(function scroller() {
    const $th = $(this).find('th h2 span:eq(1)');
    const th = $th.text();
    const rth = $th.attr('remaining-th');
    let allText = th.replace('...', '');

    allText = rth ? allText + rth : allText;

    // now get th comfortablely long enough
    const [nth, nrth] = splitByWindowSize(allText);
    // set it in the row
    $th.text(nth);
    $th.attr('remaining-th', nrth);
  });
}

function resizeSidebar(e) {
  const $exchange = $('div.exchange');
  const windowWidth = $(window).width();
  if (e.clientX > 70 && (windowWidth - e.clientX > 100)) {
    $exchange.css('left', `${e.clientX}px`);
  }
}

export function resizeOnDrag() {
  $(document).on('mousemove', resizeSidebar);
  $(document).one('mouseup', () => {
    $(document).off('mousemove', resizeSidebar);
  });
}
