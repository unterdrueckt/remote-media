const fs = require('fs');
const path = require('path');

// Define the source directories
const sourceWindows = path.join(__dirname, 'builds', 'remote-media.exe');
const sourceLinux = path.join(__dirname, 'builds', 'remote-media');
const sourceProduction = path.join(__dirname, 'production');

// Define the destination directories
const destWindows = path.join(__dirname, '..', 'release', 'windows');
const destLinux = path.join(__dirname, '..', 'release', 'linux');
const destNode = path.join(__dirname, '..', 'release', 'node');

function copyDirectory(sourceDir, destDir) {
    // Ensure the destination directory exists
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Read the contents of the source directory
    const files = fs.readdirSync(sourceDir);
    
    files.forEach(file => {
        const sourceFile = path.join(sourceDir, file);
        const destFile = path.join(destDir, file);

        // Recursively copy directories or files
        if (fs.lstatSync(sourceFile).isDirectory()) {
            copyDirectory(sourceFile, destFile); // Recursively copy subdirectories
        } else {
            fs.copyFileSync(sourceFile, destFile); // Copy files
        }
    });
}

// Function to copy files or directories
function copyFile(source, destination) {
    if (!fs.existsSync(source)) {
        throw new Error(`Source path ${source} does not exist.`);
    }

    const destDir = path.dirname(destination); // Get the directory part of the destination path

    // Ensure destination directory exists
    if (!fs.existsSync(destDir)) {
        console.log(`❗Destination directory ${destDir} does not exist. Creating it.`);
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy the file/directory
    fs.copyFileSync(source, destination);
    console.log(`✅ Successfully copied: ${source} -> ${destination}`);
}

// Copy the files
try {
    // Copy Windows executable
    copyFile(sourceWindows, path.join(destWindows, path.basename(sourceWindows)));

    // Copy Linux file
    copyFile(sourceLinux, path.join(destLinux, path.basename(sourceLinux)));


    // Copy all files from production to node release directory
    copyDirectory(sourceProduction, destNode);

    console.log('💾 Successfully copied all files to the release directory.');
} catch (error) {
    console.error('Error during copy operation:', error);
}