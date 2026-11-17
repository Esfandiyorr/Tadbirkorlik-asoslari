/* Mahalliy sahna serveri. Faqat animatsiya sahnasi va r1–r12 ssenariylari beriladi. */
const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");

exports.startPreview = async function () {
  const server = http.createServer(async (req, res) => {
    const name = new URL(req.url, "http://localhost").pathname;
    if (
      !["GET", "HEAD"].includes(req.method) ||
      !(
        /^\/sahna\.html$/.test(name) ||
        /^\/ssenariy\/r(?:[1-9]|1[0-2])\.js$/.test(name)
      )
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    try {
      const content = await fs.readFile(path.join(__dirname, name.slice(1)));
      res.writeHead(200, {
        "Content-Type": name.endsWith(".js")
          ? "application/javascript; charset=utf-8"
          : "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch {
      res.writeHead(404);
      res.end();
    }
  });
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return {
    url: "http://127.0.0.1:" + server.address().port + "/sahna.html",
    close: () => new Promise((resolve) => server.close(resolve)),
  };
};
