const fs = require('fs');
const path = require('path');

const sourceDir = path.join(__dirname, 'src', 'static');
const destDir = path.join(__dirname, 'production', 'static');

function copyDirectory(source, destination) {
    if (!fs.existsSync(source)) {
        throw new Error(`Source directory ${source} does not exist.`);
    }

    if (!fs.existsSync(destination)) {
        console.log(`❗Destination directory ${destination} does not exist. Creating it.`);
        fs.mkdirSync(destination, { recursive: true });
    }

    fs.readdirSync(source).forEach(file => {
        const sourceFile = path.join(source, file);
        const destFile = path.join(destination, file);

        if (fs.lstatSync(sourceFile).isDirectory()) {
            copyDirectory(sourceFile, destFile);
        } else {
            fs.copyFileSync(sourceFile, destFile);
        }
    });

    console.log(`💾 Successfully copied all files from: ${source} -> ${destination}`);
}

copyDirectory(sourceDir, destDir);
