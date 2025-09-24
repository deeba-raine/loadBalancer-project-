const { spawn } = require("child_process");

// Start servers
const servers = [
  "server1/server.js",
  "server2/server.js",
  "server3/server.js",
  "loadBalancer/loadBalancer.js"
];

servers.forEach((script) => {
  const child = spawn("node", [script], { stdio: "inherit" });
  child.on("exit", (code) => {
    console.log(`${script} exited with code ${code}`);
  });
});
