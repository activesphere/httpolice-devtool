
# HTTPolice-devtool

HTTPolice-devtool is a lint-tool for the HTTP.

It intercepts and sends the HTTP headers from your browser to a server running [httpolice](https://github.com/vfaronov/httpolice) where they are analysed, and a detailed report is sent back to the browser where it's displayed.

### Install
You can install the extension (in chrome browser) from [Chrome Store](https://chrome.google.com/webstore/detail/httpolice-devtool/hnlnhebgfcfemjaphgbeokdnfpgbnhgn). You should also consider running a local server (more on that below)


### Run your own server

The server is available in `PYPI`. To install and run it, simply run

`pip install hpoliced`

`hpoliced` This will try to run the server at port `8080`

`hpoliced -p <PORT NUMBER>` To run the server at a different port


Now change the server URL in the extension (see below)


>The extension is set to use a remote server by default, which can be easily changed to use one that runs on local computer.
>1. Find and click on `H` in the top right corner of Chrome toolbar.
>2. Select `Options` from under the menu. This will show a box where you can set your own server address.

### Build (Optional)

To build the extension locally, run these commands

```
$ git clone https://github.com/activesphere/httpolice-devtool.git
$ cd httpolice-devtool
$ npm install
$ npm run build

```

This will build the extension under `builds` directory. Follow [this guide](http://stackoverflow.com/a/24577660) to install it in Chrome as an unpackaged extension.


---
