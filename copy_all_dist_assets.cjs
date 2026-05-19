const fs = require('fs');
const path = require('path');

function copyFolderSync(from, to) {
  if (!fs.existsSync(to)) {
    fs.mkdirSync(to, { recursive: true });
  }
  fs.readdirSync(from).forEach(element => {
    const stat = fs.lstatSync(path.join(from, element));
    if (stat.isFile()) {
      fs.copyFileSync(path.join(from, element), path.join(to, element));
    } else if (stat.isDirectory()) {
      copyFolderSync(path.join(from, element), path.join(to, element));
    }
  });
}

const rootDir = __dirname;
const distDir = path.join(rootDir, 'frontend', 'dist');

if (fs.existsSync(distDir)) {
  console.log('Syncing all built assets from frontend/dist/ to workspace root...');
  
  // Clean workspace root assets/ folder
  const rootAssetsDir = path.join(rootDir, 'assets');
  if (fs.existsSync(rootAssetsDir)) {
    fs.rmSync(rootAssetsDir, { recursive: true, force: true });
  }

  // Copy frontend/dist content directly to workspace root
  fs.readdirSync(distDir).forEach(item => {
    const srcPath = path.join(distDir, item);
    const destPath = path.join(rootDir, item);
    const stat = fs.lstatSync(srcPath);

    if (stat.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied: ${item}`);
    } else if (stat.isDirectory() && item === 'assets') {
      copyFolderSync(srcPath, destPath);
      console.log(`Copied directory: ${item}`);
    }
  });
  console.log('Synchronization completed successfully.');
} else {
  console.error('Error: frontend/dist directory does not exist. Please run npm run build inside frontend first.');
}
