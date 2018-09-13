# webstills

This is a simple Node.js script to periodically fetch
webcam still images and save them to the current directory.

## Use

`node {-t nnn} URL`

where `nnn` is the fetch interval (default 5000).

If URL ends in a `=` an incrementing integer is appended
to it for each fetch in an attempt to avoid aggressive
request caching.

Files are named for the number of mS past the epoch when the fetch started.
