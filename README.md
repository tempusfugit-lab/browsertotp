# browsertotp

A TOTP application runnable on your browser.  
The implementations **never** access internet and the outside,
runnning on local only. So they can run standalone.

Your key used for creating a TOTP value will be saved into `window.localStorage` (
if not supported, will saved on memory).

This application uses an HOTP library [blirhotp](https://github.com/tempusfugit-lab/blirhotp).

[GitHub Pages](http://tempusfugit-lab.github.io/browsertotp/)

## Installation for local use

Download this repository.

````
git clone <repository url>
````

## Usage

View `app/index.html` in a browser.

## Brower Support

Modern browsers running on Desktop or Mobile.

## License

See LICENSE file.
