
/* global document window */

function onButtonClick() {
  this.parentElement.classList.toggle('collapsed');
}

function highlightReferences() {
  // Collect references from all contributing elements within this notice.
  const referrers = this.querySelectorAll('[data-ref-to]');
  let refs = [];
  for (let i = 0; i < referrers.length; i += 1) {
    refs = refs.concat(
      referrers[i].getAttribute('data-ref-to').split(' ')
    );
  }

  // Traverse up to the closest exchange element.
  let exchange = this;
  while (!exchange.classList.contains('exchange')) {
    exchange = exchange.parentElement;
  }

  // Add highlight to every referenced element within this exchange.
  // (``data-ref-id`` are only unique within an exchange.)
  for (let i = 0; i < refs.length; i += 1) {
    const target = exchange.querySelector(`[data-ref-id="${refs[i]}"]`);
    if (target !== null) {
      target.classList.add('highlight');
    }
  }
}

function clearHighlights() {
  const elems = document.querySelectorAll('.highlight');
  for (let i = 0; i < elems.length; i += 1) {
    elems[i].classList.remove('highlight');
  }
}

function installHovers(targetClass) {
  const notices = document.querySelectorAll(`${targetClass} .notice`);
  for (let i = 0; i < notices.length; i += 1) {
    notices[i].addEventListener('mouseover', highlightReferences);
    notices[i].addEventListener('mouseout', clearHighlights);
  }
}

function openInNewWindow(e) {
  e.preventDefault();
  window.open(e.target.href);
}

function installLinkHandlers(targetClass) {
  const anchors = document.querySelectorAll(`${targetClass} a`);
  for (let i = 0; i < anchors.length; i += 1) {
    anchors[i].addEventListener('click', openInNewWindow);
  }
}

function toggleRemarks(show, targetClass = '') {
  let remarks;
  if (targetClass) {
    remarks = document.querySelectorAll(`${targetClass} .message-remark`);
  } else {
    remarks = document.querySelectorAll('.message-remark');
  }
  for (let i = 0; i < remarks.length; i += 1) {
    remarks[i].hidden = !show;
  }
}

function onOptionsSubmit(event) {
  const boringNotices =
  document.getElementById('boringNotices').value.split(/\s+/);

  const hideBoringNotices =
  document.getElementById('hideBoringNotices').checked;

  const hideBoringExchanges =
  document.getElementById('hideBoringExchanges').checked;

  const showRemarks = document.getElementById('showRemarks').checked;

  event.preventDefault();

  const exchanges = document.querySelectorAll('.exchange');
  for (let i = 0; i < exchanges.length; i += 1) {
    const exchange = exchanges[i];
    let isBoringExchange = true;
    const notices = exchange.querySelectorAll('.notice');
    for (let j = 0; j < notices.length; j += 1) {
      const notice = notices[j];
      const severity = notice.querySelector('.severity').textContent;
      const ident = notice.querySelector('.ident').textContent;
      const isBoringNotice = (boringNotices.indexOf(severity) > -1 ||
                        boringNotices.indexOf(ident) > -1);
      notice.hidden = (hideBoringNotices && isBoringNotice);
      if (!isBoringNotice && severity !== 'D') {
        isBoringExchange = false;
      }
    }
    exchange.hidden = (hideBoringExchanges && isBoringExchange);
  }

  toggleRemarks(showRemarks);
}

export function installOptions() {
  const div = document.createElement('div');
  div.classList.add('options');
  div.classList.add('collapsed');

  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = 'options';
  button.addEventListener('click', onButtonClick);
  div.appendChild(button);

  const form = document.createElement('form');
  form.addEventListener('submit', onOptionsSubmit);
  div.appendChild(form);

  const p1 = document.createElement('p');
  form.appendChild(p1);

  const label1 = document.createElement('label');
  label1.htmlFor = 'boringNotices';
  label1.textContent = 'Boring notices:';
  p1.appendChild(label1);

  const input1 = document.createElement('input');
  input1.type = 'text';
  input1.name = 'boringNotices';
  input1.id = input1.name;
  input1.placeholder = 'example: 1089 1135 C';
  p1.appendChild(input1);

  function addCheckboxRow(id, text, title) {
    const p = document.createElement('p');
    form.appendChild(p);

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = id;
    input.id = id;
    p.appendChild(input);

    const label = document.createElement('label');
    label.htmlFor = id;
    label.textContent = text;
    p.appendChild(label);

    if (title) {
      input.title = title;
      label.title = title;
    }
  }

  addCheckboxRow('hideBoringNotices', 'Hide boring notices');
  addCheckboxRow('hideBoringExchanges', 'Hide boring exchanges',
                 'Hide exchanges that have no notices, ' +
                 'or only debug and boring notices');
  addCheckboxRow('showRemarks', 'Show remarks',
                 'Remarks may contain the input filenames ' +
                 'or other useful information.');

  const p2 = document.createElement('p');
  form.appendChild(p2);

  const submit = document.createElement('input');
  submit.type = 'submit';
  submit.value = 'Apply';
  p2.appendChild(submit);

  document.body.insertBefore(div, document.querySelector('h1'));
}

export function interactionSetup(targetClass) {
//  collapseAll(targetClass);
//  installButtons(targetClass);
  installHovers(targetClass);
  installLinkHandlers(targetClass);
//  toggleRemarks(false, targetClass);
}
