
# This listens on for HAR files
# Analyzes these requests whenever available and responds
# with whatever HTTPolice's html reports with to the client


from bottle import route, run, abort, get, post, request, response
from har import har_input
from base64 import b64decode, b64encode

import argparse
import bottle
import json
import sys


# avoid http 413 on large requests, setting it to ~5MB
bottle.BaseRequest.MEMFILE_MAX = 5242880


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description=u'HTTPolice-server')
    parser.add_argument(u'-p', u'--port', default=8080, type=int,
                        help=u'Port to be used (defaults to 8080)')
    return parser.parse_args(argv[1:])


# set reponse headers to allow cors
def enable_cors(fn):
    def _enable_cors(*args, **kwargs):
        # set CORS headers
        response.headers['Access-Control-Allow-Origin'] = '*'
        response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Origin, Accept, Content-Type, X-Requested-With, X-CSRF-Token'

        if bottle.request.method != 'OPTIONS':
            # actual request; reply with the actual response
            return fn(*args, **kwargs)

    return _enable_cors

@post('/har')
@enable_cors
def process_har():
    har = request.forms.get('payload')
    har_s = b64decode(har)
    data = json.loads(har_s)
    try:
        out = har_input(data)
        payload = {
            'reports': out.getvalue()
        }
        return json.dumps(payload)
    except Exception as e:
        abort(400, "Bad request. %s" % (e))

def main():
    args = parse_args(sys.argv)
    run(host='0.0.0.0', port=args.port)
