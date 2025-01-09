const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, 'dist', 'index.html');
const targetPath = path.join(__dirname, '..', 'backend', 'src', 'static', 'index.html');

if (!fs.existsSync(sourcePath)) {
    console.error('❗Source file does not exist:', sourcePath);
    process.exit(1);
}

fs.rename(sourcePath, targetPath, (err) => {
    if (err) {
        console.error('❗Error moving file:', err);
        process.exit(1);
    }
    console.log('File moved successfully 💾');
});