
class _Unavailable(object):

    """
    A placeholder for something that we know is present (**not** missing),
    but we don't know its exact value.
    Used as the singleton :data:`Unavailable`, like `None`.
    """

    __slots__ = ()

    def __repr__(self):
        return 'Unavailable'

    def __eq__(self, other):
        return False

    def __hash__(self):     # pragma: no cover
        return 1

class StatusCode(int):

    __slots__ = ()

    def __repr__(self):
        return 'StatusCode(%d)' % self

    informational = property(lambda self: 100 <= self <= 199)
    successful = property(lambda self: 200 <= self <= 299)
    redirection = property(lambda self: 300 <= self <= 399)
    client_error = property(lambda self: 400 <= self <= 499)
    server_error = property(lambda self: 500 <= self <= 599)


Unavailable = _Unavailable()
