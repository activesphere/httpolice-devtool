
from six.moves.urllib.parse import urlparse
from helpers import Unavailable, StatusCode

import httpolice
import StringIO


def har_input(data):
    creator = data['log']['creator']['name']
    bad_exchanges = []
    exchanges = [
        _process_entry(entry, creator, 'from chrome')
        for entry in data['log']['entries']
    ]

    # check
    for exch in exchanges:
        httpolice.check_exchange(exch)
        if any(notice.severity > 1
               for resp in exch.responses       # We only care about responses
               for notice in resp.notices):
            bad_exchanges.append(exch)

    # report
    out = StringIO.StringIO()
    if bad_exchanges:
        httpolice.html_report(bad_exchanges, out)
    return out


def _process_entry(data, creator, path):
    req = _process_request(data['request'], creator, path)
    resp = _process_response(data['response'], req, creator, path)
    return httpolice.Exchange(req, [resp] if resp is not None else [])


def _process_request(data, creator, path):
    (version, header_entries, pseudo_headers) = _process_message(data, creator)
    if creator in [u'WebInspector'] and version == u'HTTP/1.1' and u':host' in pseudo_headers:
        # SPDY exported from Chrome.
        version = None

    method = data['method']

    parsed = urlparse(data['url'])
    scheme = parsed.scheme

    if method == 'CONNECT':
        target = parsed.netloc
    elif any(name.lower() == 'host' for (name, _) in header_entries):
        # With HAR, we can't tell if the request was to a proxy or to a server.
        # So we force most requests into the "origin form" of the target,
        target = parsed.path
        if parsed.query:
            target += u'?' + parsed.query
    else:
        # However, if the request has no ``Host`` header,
        # the user won't be able to see the target host
        # unless we set the full URL ("absolute form") as the target.
        # To prevent this from having an effect on the proxy logic,
        # we explicitly set `Request.is_to_proxy` to `None` later.
        target = data['url']

    if data['bodySize'] == 0:
        # No body, or a body of length 0 (which we do not distinguish).
        body = b''
    elif data['bodySize'] > 0:
        # A message body was present, but we cannot recover it,
        # because message body is the body *with* ``Content-Encoding``,
        # and HAR does not include that.
        body = Unavailable
    else:
        # Unknown. Maybe there was a body, maybe there wasn't.
        body = None

    text = None
    post = data.get('postData')
    if post and post.get('text'):
        text = post['text']

    req = httpolice.Request(scheme, method, target, version, header_entries, body)
    if text is not None:
        req.unicode_body = text
    req.is_to_proxy = None                      # See above.
    return req


def _process_response(data, req, creator, path):
    if data['status'] == 0:          # Indicates error in Chrome.
        return None
    (version, header_entries, _) = _process_message(data, creator)
    status = StatusCode(data['status'])
    reason = data['statusText']

    if data['bodySize'] == 0 or data['content']['size'] == 0 or \
            status == 'Not Modified':
        body = b''
    elif data['bodySize'] > 0 or data['content']['size'] > 0:
        body = Unavailable
    else:
        body = None

    resp = httpolice.Response(version, status, reason, header_entries, body=body)

    if data['content'].get('text') and status != 'Not Modified':
        if data['content'].get('encoding', u'').lower() == u'base64':
            try:
                decoded_body = base64.b64decode(data['content']['text'])
            except ValueError:
                pass
            else:
                resp.decoded_body = decoded_body

        elif 'encoding' not in data['content']:
            resp.unicode_body = data['content']['text']

    return resp


def _process_message(data, creator):
    header_entries = [(unicode(d['name']), unicode(d['value']))
                      for d in data['headers']]
    pseudo_headers = pop_pseudo_headers(header_entries)
    if data['httpVersion'] == u'HTTP/2.0':          # Used by Firefox.
        version = http2
    elif data['httpVersion'] == u'unknown':           # Used by Chrome.
        version = None
    else:
        version = data['httpVersion']
    return (version, header_entries, pseudo_headers)


def pop_pseudo_headers(entries):
    """Remove and return HTTP/2 `pseudo-headers`__ from a list of headers.

    __ https://tools.ietf.org/html/rfc7540#section-8.1.2.1

    :param entries:
        A list of header name-value pairs,
        as would be passed to :class:`httpolice.Request`
        or :class:`httpolice.Response`.
        It will be modified in-place by removing all names
        that start with a colon (:).
    :return: A dictionary of the removed pseudo-headers.
    """
    i = 0
    r = {}
    while i < len(entries):
        (name, value) = entries[i]
        if name.startswith(u':'):
            r[name] = value
            del entries[i]
        else:
            i += 1
    return r
