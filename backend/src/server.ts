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

function getValidContentDir() {
  let contentDir;

  // Priority 1: User-specified directory
  if (globalConfigManager.get("settings.contentDir")) {
    contentDir = globalConfigManager.get("settings.contentDir") as string;
    try {
      fs.accessSync(contentDir, fs.constants.R_OK | fs.constants.W_OK);
    } catch (err) {
      console.warn(
        `Error accessing user-specified directory: ${contentDir}.`,
        err
      );
      contentDir = null;
    }
  }

  // Priority 2: Default directory within user's documents
  if (!contentDir) {
    const defaultDir = path.join(os.homedir(), "Documents", "remote-media");
    try {
      fs.accessSync(defaultDir, fs.constants.W_OK);
      fs.mkdirSync(defaultDir, { recursive: true });
      contentDir = defaultDir;
    } catch (err) {
      console.warn(
        `Error accessing or creating default directory: ${defaultDir}.`,
        err
      );
      contentDir = null;
    }
  }

  // Priority 3: Fallback directory (within the application's directory)
  if (!contentDir) {
    const fallbackDir = path.join(__dirname, "remote-media");
    try {
      fs.accessSync(fallbackDir, fs.constants.W_OK);
      fs.mkdirSync(fallbackDir, { recursive: true });
      contentDir = fallbackDir;
    } catch (err) {
      console.error(
        `Error accessing or creating fallback directory: ${fallbackDir}.`,
        err
      );
      throw new Error("Unable to find a suitable content directory.");
    }
  }

  globalConfigManager.set(
    "settings.contentDir",
    contentDir,
    "The media location"
  );

  return contentDir;
}

const contentPath = getValidContentDir();

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
const localIP = ip.address();
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
