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

var invalidOption = false;
const OPTIONSDOC = {
  boolean: ["m", "v", "h"],
  string: ["i"],
  alias: {
    mxf: ["m"],
    interval: ["i"],
    verbose: ["v"],
    help: ["h"]
  },
  unknown: option => {
    invalidOption = true;
    console.error(`Unknown option: ${option}`);
    return false;
  }
};
const options = getopts(process.argv.slice(2), OPTIONSDOC);

function usage() {
  console.log(`
Usage: webstills [options] URL
  -i nnn, --interval nnn    mS between fetches [default: 5000]
  -m, --mxf                 rename files to MXF creation time
  -v, --verbose             show filenames as they are written
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

function mxfdtname(d) {
  let daterxarr = /DAT=(\d{4}-\d\d-\d\d)[\r\n]/.exec(d);
  let timerxarr = /TIM=(\d\d:\d\d:\d\d\.\d{3})[\r\n]/.exec(d);
  if (daterxarr && timerxarr) {
    return `${daterxarr[1].replace(/-/g, "")}-${timerxarr[1].replace(
      /:/g,
      ""
    )}.jpg`;
  }
  return null;
}

function writeImage(filename, data) {
  let newname;
  filename = `${filename}.jpg`;
  fs.writeFile(filename, data, err => {
    if (err) {
      console.error(`${count}: error writing: ${filename}.jpg`);
    } else {
      if (options.m) {
        newname = mxfdtname(data.toString("binary", 0, 2047));
        if (newname) {
          fs.rename(filename, newname, err => {
            if (err) {
              console.error(`error renaming ${filename} to ${newname}`);
            }
          });
        }
      }
    }
    if (options.v) {
      console.log(newname ? newname : filename);
    }
  });
}

function writeDup(filename, data) {
  let dupstr = ("0000" + dup).slice(-5);
  console.log(`Write duplicate ${filename}.${dupstr}`);
  writeImage(`${filename}.${dupstr}`, data);
  dup++;
}

async function fetcher() {
  let gotOptions = {
    retries: 0,
    timeout: Math.min(1200, options.i),
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
  invalidOption ||
  (options.i.length && isNaN(parseInt(options.i, 10)))
) {
  usage();
} else {
  options.i = parseInt(options.i, 10) || DEFAULT_MS;
  setInterval(fetcher, options.i);
}
