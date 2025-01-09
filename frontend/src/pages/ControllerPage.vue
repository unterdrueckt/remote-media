<template>
  <div class="page">
    <div class="col-grid">
      <article class="btn-art">
        <header>
          <h3>Player selector</h3>
        </header>
        <div class="wrapper">
          <fieldset class="full-width">
            <template v-for="(item, key) in player">
              <label
                class="full-width-i"
                style="display: flex; align-items: center"
              >
                <span v-if="item.connected" class="circle online-circle"></span>
                <span v-else class="circle offline-circle"></span>
                <EyeOff
                  v-if="item.blackout"
                  style="margin-left: 5px; margin-right: 5px"
                />
                <Image
                  v-if="item.state.status == 'playing' && isImg(item.loaded)"
                  style="margin-left: 5px; margin-right: 5px"
                />
                <Clapperboard
                  v-if="item.state.status == 'playing' && isVideo(item.loaded)"
                  style="margin-left: 5px; margin-right: 5px"
                  />
                  <AudioLines
                  v-if="item.state.status == 'playing' && isAudio(item.loaded)"
                  style="margin-left: 5px; margin-right: 5px"
                />
                <VolumeX
                  v-if="item.state.sound === false"
                  style="margin-left: 5px; margin-right: 5px"
                />
                <span class="status-text">{{ key }}</span>
                <input
                  type="checkbox"
                  :name="key as any"
                  style="margin-left: auto; margin-top: 1px"
                  v-model="selected[key]"
                />
              </label>
            </template>
          </fieldset>
        </div>
      </article>
      <article :class="[{ dimmed: !selectedKeys.length }]" class="btn-art">
        <header>
          <h3>Controls</h3>
        </header>
        <div class="wrapper">
          <button class="btn" @click="removePlayer()">
            <Trash2 />
            Remove
          </button>
          <button
            v-if="live?.blackout !== true"
            class="btn"
            style="margin-top: 20px"
            @click="setBlackout(true)"
          >
            <EyeOff style="margin-left: 5px; margin-right: 5px" />
            Blackout
          </button>
          <button
            v-if="live?.blackout === true || live?.blackout === undefined"
            class="btn"
            style="margin-top: 20px"
            @click="setBlackout(false)"
          >
            <Eye style="margin-left: 5px; margin-right: 5px" />
            Blackout off
          </button>
          <button
            :class="[{ dimmed: !selectedMedia }]"
            class="btn"
            style="margin-top: 20px"
            @click="copyPlayCommand()"
          >
            <Copy style="margin-left: 5px; margin-right: 5px" />
            copy cmd
          </button>
        </div>
      </article>
      <article :class="[{ dimmed: !selectedKeys.length }]">
        <header>
          <h3>Content controls</h3>
        </header>
        <div>
          <select
            id="contentSelect"
            name="content"
            aria-label="Select content..."
            class="btn"
            required
            v-model="selectedMedia"
          >
            <option v-for="(item, key) in media" :key="key" :value="item">
              {{ item }}
            </option>
          </select>
          <button
            class="btn"
            @click="loadMedia()"
            :class="[{ dimmed: !selectedMedia }]"
          >
            <HardDriveUpload />
            Load
            <span v-if="!selectedMedia">(select the media to load)</span>
            <span v-else-if="live?.status == 'playing'"
              >(will stop playing content!)</span
            >
          </button>
        </div>
        <div style="margin-top: 10px">
          <h4>Status</h4>
          <span
            ><b>Loaded: </b> <span>{{ live?.loaded || "Unkown" }}</span></span
          >
          <br />
          <span
            ><b>Status: </b> <span>{{ live?.status || "Unkown" }}</span></span
          >
        </div>
        <footer>
          <div class="wrapper" :class="[{ dimmed: !live?.loaded }]">
            <button
              class="btn"
              @click="startMedia()"
              style="margin-top: 10px"
              :class="[{ dimmed: live?.status == 'playing' }]"
            >
              <Play />
              Start
            </button>
            <button
              class="btn"
              style="margin-top: 10px"
              @click="stopMedia()"
              :class="[
                { dimmed: ['paused', 'stopped'].includes(live?.status) },
              ]"
            >
              <StopCircle />
              Stop
            </button>
          </div>
        </footer>
      </article>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { socket } from "../utils/socket";
import useClipboard from "vue-clipboard3";
import {
  Eye,
  EyeOff,
  Clapperboard,
  Trash2,
  HardDriveUpload,
  Play,
  Copy,
  StopCircle,
  VolumeX,
  AudioLines,
  Image
} from "lucide-vue-next";

const { toClipboard } = useClipboard();

const player = ref({} as any);
const media = ref({} as any);
const selectedMedia = ref("");
const selected = ref({} as any);
const selectedKeys = computed(() => {
  return Object.keys(selected.value).filter(
    (key) => selected.value[key] && player.value[key]
  );
});

const isImg = (fileStr: string): boolean => {
  const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp']; // Add more image extensions if needed
  const fileExtension = fileStr.split('.').pop()?.toLowerCase();

  return fileExtension ? imageExtensions.includes(fileExtension) : false;
};

const isVideo = (fileStr: string): boolean => {
  const videoExtensions = ['mp4', 'avi', 'mkv', 'mov']; // Add more video extensions if needed
  const fileExtension = fileStr.split('.').pop()?.toLowerCase();

  return fileExtension ? videoExtensions.includes(fileExtension) : false;
};

const isAudio = (fileStr: string): boolean => {
  const audioExtensions = ['mp3', 'wav', 'ogg', 'flac']; // Add more audio extensions if needed
  const fileExtension = fileStr.split('.').pop()?.toLowerCase();

  return fileExtension ? audioExtensions.includes(fileExtension) : false;
};

const live = computed(() => {
  const selectedKeysValue = selectedKeys.value;

  if (selectedKeysValue.length === 1) {
    const selectedKey = selectedKeysValue[0];
    console.log(player.value[selectedKey]);
    console.log(player.value[selectedKey]);

    return {
      loaded: player.value[selectedKey]?.loaded,
      status: player.value[selectedKey]?.state?.status,
      blackout: player.value[selectedKey]?.blackout,
      sound: player.value[selectedKey]?.state?.sound,
    };
  } else if (selectedKeysValue.length > 1) {
    const loadedValues = selectedKeysValue.map(
      (key) => player.value[key]?.loaded
    );
    const statusValues = selectedKeysValue.map(
      (key) => player.value[key]?.state?.status
    );
    const blackoutValues = selectedKeysValue.map(
      (key) => player.value[key]?.blackout
    );
    const soundValues = selectedKeysValue.map(
      (key) => player.value[key]?.state?.sound
    );

    const uniqueLoadedValues = new Set(loadedValues);
    const uniqueStatusValues = new Set(statusValues);
    const uniqueBlackoutValues = new Set(blackoutValues);
    const uniqueSoundValues = new Set(soundValues);

    const loaded =
      uniqueLoadedValues.size === 1 ? loadedValues[0] : "multiple selected";
    const status =
      uniqueStatusValues.size === 1 ? statusValues[0] : "multiple selected";
    const blackout =
      uniqueBlackoutValues.size === 1 ? blackoutValues[0] : undefined;
    const sound = uniqueSoundValues.size === 1 ? soundValues[0] : undefined;

    return { loaded, status, blackout, sound };
  }

  // Handle the case when no keys are selected
  return { loaded: null, status: null, blackout: null };
});

watch(
  player.value,
  (oldPlayerStates: any, newPlayerStates: any) => {
    console.log(oldPlayerStates);
    console.log(newPlayerStates);
  },
  { deep: true }
);

function setBlackout(value = true) {
  for (const key in selectedKeys.value) {
    socket.emit("control", {
      event: "blackout",
      playerId: selectedKeys.value[key],
      value,
    });
  }
}

function removePlayer() {
  if (confirm("Are you sure you want to remove the selected player?")) {
    socket.emit("control", {
      event: "remove",
      playerIds: selectedKeys.value,
    });
  }
}

async function copyPlayCommand() {
  let cmd = "";
  for (const key in selectedKeys.value) {
    const playerId = selectedKeys.value[key];
    cmd += `${playerId}:p:${selectedMedia.value};`;
  }
  try {
    await toClipboard(cmd);
    console.log("Copied to clipboard");
  } catch (e) {
    console.error(e);
  }
}

function loadMedia() {
  for (const key in selectedKeys.value) {
    socket.emit("control", {
      event: "loadMedia",
      playerId: selectedKeys.value[key],
      value: selectedMedia.value,
    });
  }
}

function startMedia() {
  for (const key in selectedKeys.value) {
    socket.emit("control", {
      event: "startMedia",
      playerId: selectedKeys.value[key],
    });
  }
}

function stopMedia() {
  for (const key in selectedKeys.value) {
    socket.emit("control", {
      event: "stopMedia",
      playerId: selectedKeys.value[key],
    });
  }
}

socket.on("allPlayer", (data: any) => {
  player.value = data;
});
socket.on("contentList", (data: any) => {
  media.value = data;
});
</script>

<style scoped>
.page {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
.btn {
  min-width: 100px;
  width: 100%;
}

.dimmed {
  opacity: 0.5;
  pointer-events: none;
}

article {
  min-width: 250px;
  border-radius: 15px;
  overflow: hidden;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
}
@media (min-width: 768px) {
  .btn-art {
    width: 250px;
  }
  .col-grid {
    justify-content: flex-start;
    grid-auto-flow: column;
    grid-gap: 10px;
  }
}

.col-grid {
  display: grid;
  justify-content: flex-start;
  columns: 100px auto 100px;
  /* column-width: ;
  column-count: ; */
  grid-gap: 10px;
}
</style>
