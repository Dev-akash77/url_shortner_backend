import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import { createServer } from "http";
import path from "path";
// const PORT = 3000;
const FILE_PATH = path.join("data", "links.json");

// !save file
const saveLink = async (link) => {
  writeFile(FILE_PATH, JSON.stringify(link));
};

// ! function to save links and data into file data base using node js
const loadLinkss = async () => {
  try {
    const data = await readFile(FILE_PATH, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(FILE_PATH, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};

// ! function to read file to serve data in our node server
const readfile = async (res, filePath, contentType) => {
  try {
    const data = await readFile(filePath);
    res.writeHead(200, { "content-type": contentType });
    res.end(data);
  } catch (error) {
    res.writeHead(404, { "content-type": contentType });
    res.end("404 page not found");
  }
};

const server = createServer(async (req, res) => {
  if (req.method === "GET") {
    if (req.url === "/") {
      readfile(res, path.join("public", "index.html"), "text/html");
    } else if (req.url === "/style.css") {
      readfile(res, path.join("public", "style.css"), "text/css");
    } else if (req.url === "/links") { 
      const links = await loadLinkss();
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(links));
    } else { 
      const link = await loadLinkss();
      const shortCode = req.url.slice(1);
      if (link[shortCode]) {
        res.writeHead(302,{location:link[shortCode]});
        return res.end();
      }
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("short url not found");
    }
  }
  if (req.method === "POST" && req.url === "/shorten") {
    let body = "";
    // ? when data will be there
    req.on("data", (chunk) => {
      body += chunk;
    });

    // ! when data wiull be end
    req.on("end", async () => {
      const { url, shortUrl } = JSON.parse(body);
      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("url is required");
      }
      const link = loadLinkss();
      const finalCode = shortUrl || crypto.randomBytes(5).toString("hex");
      if (link[finalCode]) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("short code allready exix. please choose another");
      }
      link[finalCode] = url;
      await saveLink(link);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "Short URL created successfully",
          shortUrl: finalCode,
          url: url,
        })
      );
    });
  }
});

// ! here is the PORT of our server
server.listen(8001, () => {
  console.log(`server running at the port ${8001}`);
});
