# webstills

This is a simple Node.js script to periodically fetch
webcam still images and save them to the current directory.

## Use

```
node [options] URL

  -i nnn, --interval nnn    mS between fetches [default: 5000]
  -m, --mxf                 rename files to MXF creation time
  -v, --verbose             show filenames as they are written
  -h, --help                show this help
```

If URL ends in a `=` an incrementing integer is appended
to it for each fetch in an attempt to avoid aggressive
request caching.

By default, files are named for the number of mS past the
epoch when the fetch started.
