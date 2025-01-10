## Ontime Integration for Media Playback

This document explains how to integrate ontime with your media playback system using the provided code.

**1. Configuration:**

All ontine integration settings are managed under section `[ontime]` in `/config/main.conf`.

- **Enable Ontime:** Set `enableOntime` to `true`.
- **Ontime Server URL:** Set `ontimeUrl` to the URL of your ontime server.
- **Ontime User Field:** `ontimeUser` defines the name of the user field in the ontime event data that will contain the media playback commands.

**2. Ontime Event Data:**

- To control media playback, populate the user field with a semicolon-separated list of commands.
- Each command consists of:

  - `playerId`: The ID of the player to control.
  - `commandType`: The action to perform (`load`, `play`, `stop`, `fade`).
  - `media`: The filename of the media file (see [README](README.md) for more information).

- **Example:**

  ```json
  {
    "payload": {
      "eventNow": {
        "id": "12345",
        "user0": "player1:load:video1.mp4;player2:play;player3:fade:500"
      }
    }
  }
  ```

  This example would: - Load `video1.mp4` into player1. - Start playback on player2. - Fade the current media on player3 with a duration of 500 milliseconds.

**3. Supported Commands:**

- `load`, `l`: Loads the specified media into the player.
- `play`, `start`, `p`: Starts or resumes playback of the current media.
- `stop`, `s`: Stops playback.
- `fade`, `f`: Fades the media with the specified duration in milliseconds.

### Notes

- Ensure that the `media` specified in the commands exists in the `contentList`.
- Ensure that the `player` specified in the commands exists and is connected when triggering.
- The integration automatically reconnects to the ontime server if the connection is lost.
