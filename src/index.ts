// webstills

const VERSION = "1.0.0";
const DEFAULT_MS = 5000; // time between fetches

const fs = require("fs");
const got = require("got");
const getopts = require("getopts");
var count = 0;
var start = 0;
var dup = 0;
var filename;
var lastImage;

const options = getopts(process.argv.slice(2), {
  boolean: ["h"],
  string: ["t"],
  alias: {
    interval: ["t"],
    help: ["h"]
  }
});

function usage() {
  console.log(`
Usage: webstills [options] URL
  -t nnn, --interval nnn    mS between fetches [default: 5000]
  -h, --help                show this help
N.B.  If URL ends with =, an incrementing counter is added to
      the URL to improve cache busting.
  `);
  if (options.h) {
    console.log(`Version ${VERSION}`);
  } else {
    process.exitCode = 1;
  }
}

function writeImage(filename, data) {
  fs.writeFile(filename + ".jpg", data, err => {
    if (err) console.log(`${count}: error writing: ${filename}.jpg`);
  });
}

function writeDup(filename, data) {
  let dupstr = ("0000" + dup).slice(-5);
  console.log(`Write ${filename}.${dupstr}`);
  writeImage(`${filename}.${dupstr}`, data);
  dup++;
}

async function fetcher() {
  let gotOptions = {
    retries: 0,
    timeout: Math.min(1000, options.t),
    encoding: null,
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:58.0) Gecko/20100101 Firefox/58.0"
    }
  };
  let url = options._[0];

  if (url.slice(-1) === "=") {
    url = url + count;
  }

  try {
    if (start) {
      writeDup(start, lastImage);
    } else {
      start = Date.now();
      const response = await got(url, gotOptions);
      // FIXME should probably ping pong rather than copy
      lastImage = response.body.slice(0);
      filename = start;
      start = 0;
      dup = 0;
      writeImage(filename, response.body);
    }
  } catch {
    let dupname = start;
    writeDup(start, lastImage);
    start = 0;
  }

  if (count++ > 1000000) {
    count = 0;
  }
}

if (
  options._.length !== 1 ||
  (options.t.length && isNaN(parseInt(options.t, 10)))
) {
  usage();
} else {
  options.t = parseInt(options.t, 10) || DEFAULT_MS;
  setInterval(fetcher, options.t);
}
