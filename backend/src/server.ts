import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import ip from "ip";
import os from "os";
import { globalConfigManager } from "easy-conf-manager";
import { initializeSocket } from "./services/socket";
import { contentRouter, initializeContentIndexing } from "./services/content";
import { initializeOntime } from "./services/ontime";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" },
});

if (!globalConfigManager.get("settings.contentDir")) {
  const defContentDir = path.join(os.homedir(), "Documents", "remote-media");
  const fallbackContentDir = path.join(__dirname, "remote-media");

  try {
    fs.accessSync(defContentDir, fs.constants.W_OK);
    console.log(
      "No media content directory specified! Default to:",
      defContentDir
    );
    fs.mkdirSync(defContentDir, { recursive: true });
    globalConfigManager.set(
      "settings.contentDir",
      defContentDir,
      "The media location"
    );
  } catch (err) {
    console.warn(
      `No write permissions to ${defContentDir} directory, falling back to ${fallbackContentDir}`
    );
    fs.mkdirSync(fallbackContentDir, { recursive: true });
    globalConfigManager.set(
      "settings.contentDir",
      fallbackContentDir,
      "The media location (FALLBACK USED)"
    );
  }
}

const contentPath = globalConfigManager.get("settings.contentDir") as string;

app.use("/content", contentRouter(contentPath));
app.use("/assets", express.static(path.join(__dirname, "static/assets")));
app.get("/control", (req, res) =>
  res.sendFile(path.join(__dirname, "static/index.html"))
);
app.get("/player/:id", (req, res) =>
  res.sendFile(path.join(__dirname, "static/player.html"))
);
app.get("/*", (_, res) => res.sendStatus(404));

// Initialize services
initializeContentIndexing(io, contentPath);
initializeSocket(io);
initializeOntime();

// Start server
const serverPort = globalConfigManager.get("settings.serverPort") || 3000;
const localIP = ip.address()
const controlURL = `http://${localIP}:${serverPort}/control`;
const playerURL = `http://${localIP}:${serverPort}/player/<id>`;

// Log useful info for the user
server.listen(serverPort, () => {
  console.log(`\n🚀 Server started!`);
  console.log(`🔧 Control page: ${controlURL}`);
  console.log(`❗ Change the <id> to the name the web player should have!`);
  console.log(`📺 Player page: ${playerURL}`);
  console.log(`⚡ Press CTRL+C to stop the server.\n\n`);
});
