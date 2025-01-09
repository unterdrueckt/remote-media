import { utils } from "easy-conf-manager";
import { Socket } from "socket.io";
import * as fs from "fs";
import { EventEmitter } from "events";
import { globalConfigManager } from "easy-conf-manager";

interface StateChangeEvent {
  playerId: string;
  newState: StateObj;
}

interface SubStateObj {
  status: string;
  sound: boolean | undefined;
}

export interface StateObj {
  connected: boolean;
  state: SubStateObj;
  loaded: string;
  blackout: boolean;
  fadeDuration: number;
  startTime: number;
}

export interface StatesObj {
  [id: string]: StateObj;
}

if (!globalConfigManager.get("settings.defaultFade")) {
  globalConfigManager.set(
    "settings.defaultFade",
    500,
    "The default fade when Media starts/stops"
  );
}

if (!globalConfigManager.get("settings.saveState")) {
  globalConfigManager.set(
    "settings.saveState",
    true,
    "Whether a status file should be saved and used when starting and stopping the server. (Can cause error!)"
  );
}

class PlayerService extends EventEmitter {
  private readonly stateFilePath = "playerServiceState.json";

  private states: StatesObj = {};

  private sockets: { [id: string]: Socket } = {};

  constructor() {
    super();
    if (
      !globalConfigManager.get("settings.saveState") ||
      globalConfigManager.get("settings.saveState")
    ) {
      this.readStateFromFile();
    }

    // Save state to file when the server is gracefully shutting down
    process.on("SIGINT", () => {
      if (
        !globalConfigManager.get("settings.saveState") ||
        globalConfigManager.get("settings.saveState")
      ) {
        console.log("Server is shutting down. Saving state to file.");
        this.writeStateToFile();
      } else {
        console.log("Server is shutting down.");
      }
      process.exit();
    });

    // Save state to file when an unhandled exception occurs
    process.on("uncaughtException", (error) => {
      if (
        !globalConfigManager.get("settings.saveState") ||
        globalConfigManager.get("settings.saveState")
      ) {
        console.error("Uncaught exception. Saving state to file.", error);
        this.writeStateToFile();
      } else {
        console.error("Uncaught exception. ", error);
      }
      process.exit(1);
    });
  }

  public getAllPlayer() {
    let player = this.states;
    for (const key in this.states) {
      player[key].connected = this.isConnected(key);
    }
    return player;
  }

  public setPlayer(playerId: string, socket: Socket) {
    this.sockets[playerId] = socket;
    if (this.isConnected(playerId)) {
      console.warn(
        `Allready connected player ${playerId} reconnects. Removing old player handeler!`
      );
      this.sockets[playerId].disconnect();
    }
    this.setPlayerState(playerId, { connected: true });
    this.sockets[playerId].on("playstatus", (message) => {
      if (utils.isObject(message)) {
        let oldState = this.getPlayerState(playerId)?.state;
        if (!utils.isObject(oldState)) {
          oldState = { status: "", sound: undefined };
        }
        const newState = utils.extend(true, oldState, message);
        this.setPlayerState(playerId, { state: newState });
      }
    });
    this.sockets[playerId].on("disconnect", () => {
      if (this.states[playerId]) {
        this.states[playerId].connected = false;
        console.log(`Player ${playerId} disconnected!`);
        this.sockets[playerId].removeAllListeners();
        this.emit("connect");
      }
    });
    console.log(`Player ${playerId} connected!`);
    this.emit("connect");
  }

  public isConnected(playerId: string): boolean {
    return this.states[playerId]?.connected && this.sockets[playerId]
      ? true
      : false;
  }

  public loadMedia(playerId: string, media: string) {
    if (this.isConnected(playerId)) {
      const state = this.getPlayerState(playerId);
      if (state.loaded != media) {
        this.setPlayerState(playerId, { loaded: media });
      }
      return true;
    }
    return false;
  }

  public startMedia(playerId: string, media?: string) {
    if (this.isConnected(playerId)) {
      const state = this.getPlayerState(playerId);
      if (state.loaded != media && media) {
        this.setPlayerState(playerId, { loaded: media });
      }
      if (state.loaded) {
        this.sockets[playerId]?.emit("startMedia");
      }
      return true;
    }
    return false;
  }

  public setPlayerOptions(
    playerId: string,
    options: Partial<{ fadeDuration: number; blackout: boolean }>
  ) {
    return this.setPlayerState(playerId, options);
  }

  public stopMedia(playerId: string) {
    if (this.isConnected(playerId)) {
      this.sockets[playerId]?.emit("stopMedia");
      return true;
    }
    return false;
  }

  public blackout(playerId: string, value: boolean) {
    this.setPlayerOptions(playerId, { blackout: value });
    if (this.isConnected(playerId)) {
      return true;
    }
    return false;
  }

  public getPlayerState(playerId: string) {
    return this.states[playerId];
  }

  public removePlayer(playerId: string) {
    // Remove the socket from the sockets object
    delete this.states[playerId];
    this.sockets[playerId]?.disconnect();
    this.sockets[playerId]?.removeAllListeners();

    // Remove the socket from the sockets object
    delete this.sockets[playerId];

    console.log(`Player ${playerId} removed!`);
    this.emit("connect");
  }

  private setPlayerState(playerId: string, options: Partial<StateObj>) {
    let state = this.getPlayerState(playerId);
    let defFade = 500;
    if (
      globalConfigManager.get("settings.defaultFade") &&
      !isNaN(globalConfigManager.get("settings.defaultFade") as any)
    ) {
      defFade = globalConfigManager.get("settings.defaultFade") as any;
    }
    if (!state) {
      state = {
        connected: false,
        state: {
          status: "",
          sound: undefined,
        },
        loaded: "",
        blackout: false,
        fadeDuration: defFade,
        startTime: 0,
      };
    }
    this.states[playerId] = utils.extend(true, state, options);
    if (this.isConnected(playerId)) {
      this.sockets[playerId]?.emit("playerState", this.states[playerId]);
    }
    const event: StateChangeEvent = {
      playerId,
      newState: this.states[playerId],
    };
    this.emit("change", event);
    return this.states[playerId];
  }

  // Function to write the state object to a file
  private writeStateToFile() {
    try {
      const stateJSON = JSON.stringify(this.states);
      fs.writeFileSync(this.stateFilePath, stateJSON);
      console.log("State saved to file.");
    } catch (error) {
      console.error("Error writing state to file:", error);
    }
  }

  // Function to read the state object from a file
  private readStateFromFile() {
    if (!fs.existsSync(this.stateFilePath)) {
      console.log("State file does not exist. No state loaded.");
      return;
    }

    try {
      const stateJSON = fs.readFileSync(this.stateFilePath, "utf-8");
      this.states = JSON.parse(stateJSON);
      console.log("State loaded from file.");
    } catch (error) {
      console.error("Error reading state from file:", error);
    }
  }
}

const playerService = new PlayerService();
export default playerService;
