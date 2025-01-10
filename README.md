# **Remote-Media Server**

A **web-based remote video player** that lets you play remotly media files across multiple players, all in an intuitive interface!

## 🚀 Features

- **Ontime Integration**: Trigger media via [ontime](https://github.com/cpvalente/ontime) events ([more infos](ontime-usage.md)).
- **Multi-Player Support**: Connect to multiple players simultaneously with a smooth web interface.
- **Versatile Media Playback**: Play **images**, **videos**, and **audio**.
- **Simple Setup**: Easy to install and run with either a pre-built executable or via `npm`.
- **Control Multiple Players**: You can connect and control multiple players at once.

---

## 💻 Installation & Usage

### 🏃‍♂️ **Run with Pre-built Executables**

1. Download the appropriate executable for your platform:
   - [Windows Executable](./releases/download/Pre-Build/remote-media_win.exe) 💻
   - [Linux Executable](./releases/download/Pre-Build/remote-media_linux) 🐧
2. Run the executable:
   - On **Windows**: Double-click `remote-media.exe`.
   - On **Linux**: Run the terminal command: `./remote-media` 🖥️.

This will start the server on `http://localhost:3000` by default! 🖥️

---

### 🌐 **Access the Web Interface**

- 🌍**Control Interface**: Open your browser and go to:  
   [http://127.0.0.1:3000/control](http://127.0.0.1:3000/control)

  Here, you can test and control your media players across all connected devices.

- 📺**Player Interface**: To add a media player, go to:  
   [http://127.0.0.1:3000/player/playerId](http://127.0.0.1:3000/player/playerId)
  Replace `playerId` with the **player ID** (you’ll see this in the control interface) to view and control that specific player.

---

## 🎬 **Media Playback**

- By default, a **test image** will be available for playback.
- To play **custom media files**, place them in:
  - `~/Documents/remote-media/` (on most systems)
  - Alternatively, point the **server's `server.contentPath`** setting in `config/main.conf` to your preferred media folder.

---

## ⚙️ **Configuration**

- **Main Config File**: You can configure the server settings in `config/main.conf`.

---

### **Supported Media Types**

- **Images**: `.jpg`, `.png`, `.svg`, etc.
- **Videos**: `.mp4`, `.avi`, `.mkv`, etc.
- **Audio**: `.mp3`, `.wav`, etc.

---

### 🏗️ **Build it yourself**

1. **Build the frontend**:

   ```bash
   cd frontend
   npm install
   npm run build
   ```

2. **Build the backend**:

   ```bash
   cd ../backend
   npm install
   npm run release
   ```

   or

   ```bash
   cd ../backend
   npm install
   npm run prepare

   # pack into one executable via
   # windows
   npm run build:win
   # or linux
   npm run build:linux
   ```

---

## 🤝 Contributing

Contributions are welcome! Please open an issue or a pull request to improve the library.

---

## 📜 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.
