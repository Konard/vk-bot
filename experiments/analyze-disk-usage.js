const fs = require('fs').promises;
const path = require('path');

async function analyzeDiskUsage() {
  console.log('Analyzing potential cache files and their sizes...');

  // Check data directory structure
  const dataDir = './data';
  try {
    await fs.access(dataDir);
    console.log('Data directory exists');

    async function getDirectorySize(dir) {
      let totalSize = 0;
      const files = await fs.readdir(dir, { withFileTypes: true });

      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          totalSize += await getDirectorySize(filePath);
        } else {
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          console.log(`File: ${filePath}, Size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
        }
      }
      return totalSize;
    }

    const totalSize = await getDirectorySize(dataDir);
    console.log(`Total data directory size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);

  } catch (error) {
    console.log('Data directory does not exist or is not accessible');
  }

  // Check current directory for large files
  console.log('\nLarge files in current directory:');
  const files = await fs.readdir('.');
  for (const file of files) {
    try {
      const stats = await fs.stat(file);
      if (stats.isFile() && stats.size > 1024 * 1024) { // Files larger than 1MB
        console.log(`${file}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      }
    } catch (error) {
      // Ignore errors for individual files
    }
  }

  // Check available disk space
  try {
    const stats = await fs.statfs('.');
    const totalSpace = stats.blocks * stats.blksize;
    const freeSpace = stats.bavail * stats.blksize;
    const usedSpace = totalSpace - freeSpace;

    console.log(`\nDisk space analysis:`);
    console.log(`Total: ${(totalSpace / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Used: ${(usedSpace / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Free: ${(freeSpace / 1024 / 1024 / 1024).toFixed(2)} GB`);
    console.log(`Usage: ${((usedSpace / totalSpace) * 100).toFixed(2)}%`);

    if (freeSpace < 100 * 1024 * 1024) { // Less than 100MB free
      console.log('WARNING: Low disk space detected!');
    }
  } catch (error) {
    console.log('Could not check disk space:', error.message);
  }
}

if (require.main === module) {
  analyzeDiskUsage().catch(console.error);
}

module.exports = { analyzeDiskUsage };