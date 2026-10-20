const http = require('http');

const server = http.createServer((req, res) => {
  const target = `http://localhost:3000${req.url}`;
  res.writeHead(307, {
    Location: target,
    'Access-Control-Allow-Origin': '*',
  });
  res.end(`Redirecting to ${target}`);
});

server.listen(3001, () => {
  console.log('Redirect server listening on port 3001 -> 3000');
});
