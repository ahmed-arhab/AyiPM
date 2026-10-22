// Loaded with `node --require` before the production server (the Docker image and `npm start`).
//
// The /api rewrite passes X-Forwarded-For to the backend exactly as the client sent it and never adds the address the
// request came from, so the backend can't tell clients apart for its sign-in rate limits. This appends the address of
// each incoming connection to the header. The backend reads the header from the right and only believes entries added
// by proxies listed in TRUSTED_PROXIES, so anything a client writes into it is ignored.
const http = require('node:http');

const emit = http.Server.prototype.emit;

http.Server.prototype.emit = function (event, request, ...rest) {
  if (event === 'request') {
    const address = request.socket?.remoteAddress;
    if (address) {
      const forwarded = request.headers['x-forwarded-for'];
      request.headers['x-forwarded-for'] = forwarded ? `${forwarded}, ${address}` : address;
    }
  }
  return emit.call(this, event, request, ...rest);
};
