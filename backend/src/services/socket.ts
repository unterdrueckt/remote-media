import { Server } from "socket.io";
import playerService from "./player";
import { contentList } from "./content";

export function initializeSocket(io: Server) {
  playerService.on("change", (data) => {
    io.sockets.emit("state", data);
    io.sockets.emit("allPlayer", playerService.getAllPlayer());
  });

  playerService.on("connect", () => {
    io.sockets.emit("allPlayer", playerService.getAllPlayer());
  });

  io.on("connection", (socket) => {
    const playerId = socket.handshake.query?.playerId as string;

    if (playerId) {
      playerService.setPlayer(playerId, socket);
      return;
    }

    socket.emit("allPlayer", playerService.getAllPlayer());
    io.emit("contentList", contentList);

    socket.on("control", (message) => {
      if (!message.playerId && !message.playerIds) return;

      switch (message.event) {
        case "loadMedia":
          playerService.loadMedia(message.playerId, message.value);
          break;
        case "startMedia":
          playerService.startMedia(message.playerId);
          break;
        case "stopMedia":
          playerService.stopMedia(message.playerId);
          break;
        case "blackout":
          playerService.blackout(message.playerId, message.value);
          break;
        case "remove":
          message.playerIds.forEach((id: string) => playerService.removePlayer(id));
          break;
      }
    });

    socket.on("disconnect", () => console.log("Controller disconnected"));
  });
}
