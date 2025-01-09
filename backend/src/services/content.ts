import fs from "fs";
import path from "path";
import { Server } from "socket.io";
import { Request, Response } from "express";
export let contentList: string[] = [];

export function initializeContentIndexing(io: Server, contentPath: string) {
  const indexContent = (resend = false) => {
    fs.readdir(contentPath, (err, files) => {
      if (err) {
        console.error("Error reading content folder:", err);
      } else {
        files.push("Test-Image.svg")
        if (resend || JSON.stringify(contentList) !== JSON.stringify(files)) {
          console.log("New files in media found");
          contentList = files;
          io.emit("contentList", contentList);
        }
      }
    });
  };

  // Get a new index every 10 seconds
  setInterval(() => indexContent(), 10 * 1000);
  indexContent();
}

export function contentRouter(contentPath: string) {
  const router = require("express").Router();

  
  router.get("/*", (req: Request, res: Response) => {
    let filePath = path.join(contentPath, req.url);
    if(req.url == '/Test-Image.svg') {
      const rootDir = process.cwd();
      filePath = path.join(rootDir, "static","Test-Image.svg")
    }
    fs.access(filePath, fs.constants.F_OK, (err) => {
      if (!err) {
        res.sendFile(filePath);
      } else {
        res.status(404).send("File not found");
      }
    });
  });

  return router;
}
