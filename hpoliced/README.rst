HTTPolice-Web
-------------

Httpolice-Web turns `HTTPolice`_ into a web server. This was written for
`HTTPolice-devtool`_ which is a `Chrome extension`_ that intercepts HTTP
requests and gets them analysed and shows reports generated through a
devtool panel.


**Usage**

This will start the server at port ``8080``

::

    $ httpolice-web

To specify an arbitrary port number

::

    $ httpolice-web -p <port>

.. _HTTPolice: https://github.com/vfaronov/httpolice
.. _HTTPolice-devtool: https://github.com/activesphere/httpolice-devtool
.. _Chrome extension: https://chrome.google.com/webstore/detail/httpolice-devtool/hnlnhebgfcfemjaphgbeokdnfpgbnhgn
