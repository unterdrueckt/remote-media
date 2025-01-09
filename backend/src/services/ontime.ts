import { globalConfigManager } from "easy-conf-manager";
import WebSocket from "ws";
import playerService from "./player";
import { contentList } from "./content";

function parseString(str: string) {
  return str
    .split(";")
    .filter((cmd) => cmd)
    .map((command) => {
      const [playerId, commandType, media] = command.split(":");
      return { playerId, command: commandType, media };
    });
}

if (globalConfigManager.get("ontime.enableOntime") === undefined) {
  globalConfigManager.set(
    "ontime.enableOntime",
    false,
    "Enable or disable the ontime connection"
  );
}

if (!globalConfigManager.get("ontime.ontimeUrl")) {
  globalConfigManager.set(
    "ontime.ontimeUrl",
    "0.0.0.0:4001/ws",
    "The ontime server url"
  );
}

if (!globalConfigManager.get("ontime.ontimeUser")) {
  globalConfigManager.set(
    "ontime.ontimeUser",
    "user0",
    "The ontime user field the media playback listens to"
  );
}

export function initializeOntime() {
  const ontimeEnabled = globalConfigManager.get("ontime.enableOntime") as boolean;

  if (!ontimeEnabled) return;

  const ontimeUrl = globalConfigManager.get("ontime.ontimeUrl") as string;
  const ontimeUser = globalConfigManager.get("ontime.ontimeUser") as string;

  let socket: WebSocket;
  let prevEventId = "";

  const connect = () => {
    socket = new WebSocket(`ws://${ontimeUrl}`);

    socket.on("open", () => console.log("ontime connected!"));

    socket.on("message", (data) => {
      try {
        const event = JSON.parse(data.toString());
        const curEventId = event?.payload?.eventNow?.id || undefined;
        const userData = event?.payload?.eventNow?.[ontimeUser] || undefined;

        if (event.type === "ontime" && userData && curEventId !== prevEventId) {
          const regex = /^([^:]+:[^:]+:[^:]+;)+$/;
          if (regex.test(userData)) {
            const mediaReq = parseString(userData);

            for (const { playerId, command, media } of mediaReq) {
              if (playerService.getPlayerState(playerId)) {
                if (contentList.includes(media)) {
                  switch (command) {
                    case "l":
                    case "load":
                      playerService.loadMedia(playerId, media);
                      break;
                    case "p":
                    case "play":
                    case "start":
                      playerService.startMedia(playerId, media);
                      break;
                    case "f":
                    case "fade":
                      playerService.setPlayerOptions(playerId, { fadeDuration: parseInt(media) });
                      break;
                    case "s":
                    case "stop":
                      playerService.stopMedia(playerId);
                      break;
                    default:
                      console.warn(`Invalid command ${command} requested by ontime.`);
                  }
                } else {
                  console.warn(`Media ${media} does not exist!`);
                }
              } else {
                console.warn(`Player ${playerId} does not exist!`);
              }
            }
          } else {
            console.warn("Invalid ontime userData:", userData);
          }
        }
        prevEventId = curEventId || prevEventId;
      } catch {}
    });

    socket.on("close", () => {
      console.log("ontime disconnected. Reconnecting...");
      setTimeout(connect, 1000);
    });

    socket.on("error", (err: any) => {
      if (err.errno !== -4078) console.error("WebSocket error:", err);
    });
  };

  connect();
}
