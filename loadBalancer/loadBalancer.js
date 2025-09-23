// loadBalancer.js
const http = require("http");
const fs = require("fs");

// Define your servers  
const servers = [
  { host: "localhost", port: 8081, healthy: true },
  { host: "localhost", port: 8082, healthy: true },
  { host: "localhost", port: 8083, healthy: true },
];

let current = 0; // for round robin

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] ${message}\n`;
  fs.appendFile("loadbalancer.log", logLine, (err) => {
    if (err) console.error("Logging failed:", err);
  });
}

// Health check every 5 seconds
setInterval(() => {
  servers.forEach((server) => {
    const options = { method: "GET", host: server.host, port: server.port, path: "/health" }; // Ping /health
    const req = http.request(options, (res) => {
      server.healthy = res.statusCode === 200;
      console.log(`Health check: ${server.host}:${server.port} → ${server.healthy ? "UP" : "DOWN"}`);
    });
    req.on("error", () => {
      server.healthy = false;
      console.log(`Health check: ${server.host}:${server.port} → DOWN`);
    });
    req.end();
  });
}, 5000);

// Create load balancer on port 8080
const balancer = http.createServer((clientReq, clientRes) => {
  const start = Date.now();
  let target;

  // Round robin among healthy servers
  for (let i = 0; i < servers.length; i++) {
    current = (current + 1) % servers.length;
    if (servers[current].healthy) {
      target = servers[current];
      break;
    }
  }

  if (!target) {
    clientRes.writeHead(503);
    clientRes.end("No healthy servers available");
    log(`Request ${clientReq.method} ${clientReq.url} → FAILED (No healthy servers)`);
    return;
  }

  // Forward the request to the chosen server
  const proxy = http.request(
    {
      host: target.host,
      port: target.port,
      path: clientReq.url,
      method: clientReq.method,
      headers: clientReq.headers,
    },
    (serverRes) => {
      const duration = Date.now() - start;
      clientRes.writeHead(serverRes.statusCode, serverRes.headers);
      serverRes.pipe(clientRes, { end: true });
      log(`${clientReq.method} ${clientReq.url} → ${target.host}:${target.port} → ${serverRes.statusCode} (${duration}ms)`);
    }
  );

  clientReq.pipe(proxy, { end: true });

  proxy.on("error", (err) => {
    const duration = Date.now() - start;
    clientRes.writeHead(502);
    clientRes.end("Bad Gateway");
    log(`${clientReq.method} ${clientReq.url} → ${target.host}:${target.port} → ERROR (${duration}ms) ${err.message}`);
    // Mark server as down immediately
    target.healthy = false;
  });
});

balancer.listen(8080, () => {
  console.log("Load Balancer running at http://localhost:8080");
});
