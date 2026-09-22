const http = require("http");
const { spawn } = require("child_process");

async function main() {
  const chrome = spawn("/usr/bin/google-chrome", [
    "--headless",
    "--disable-gpu",
    "--remote-debugging-port=9222",
    "http://localhost:3000"
  ]);

  await new Promise(r => setTimeout(r, 2000));

  const jsonStr = await new Promise((resolve, reject) => {
    http.get("http://127.0.0.1:9222/json", (res) => {
      let data = "";
      res.on("data", chunk => data += chunk);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });

  const targets = JSON.parse(jsonStr);
  const pageTarget = targets.find(t => t.type === "page");
  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  await new Promise((resolve) => {
    ws.onopen = resolve;
  });

  let msgId = 1;
  function send(method, params = {}) {
    return new Promise((resolve) => {
      const id = ++msgId;
      const handler = (evt) => {
        const msg = JSON.parse(evt.data);
        if (msg.id === id) {
          ws.removeEventListener("message", handler);
          resolve(msg.result);
        }
      };
      ws.addEventListener("message", handler);
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await send("Runtime.enable");

  // Wait 2 seconds for initial render & intro
  await new Promise(r => setTimeout(r, 2000));

  const imarkRes = await send("Runtime.evaluate", {
    expression: 'document.querySelector(".i-mark") ? document.querySelector(".i-mark").outerHTML : "no imark"'
  });
  console.log("IMARK:", imarkRes.result.value);

  const heroRes = await send("Runtime.evaluate", {
    expression: 'document.querySelector(".hero-title") ? document.querySelector(".hero-title").outerHTML : "no hero-title"'
  });
  console.log("HERO-TITLE:", heroRes.result.value);

  const introPhase = await send("Runtime.evaluate", {
    expression: 'document.querySelector(".intro") ? document.querySelector(".intro").className : "no intro"'
  });
  console.log("INTRO CLASS:", introPhase.result.value);

  ws.close();
  chrome.kill();
}

main().catch(console.error);
