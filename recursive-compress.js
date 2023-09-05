const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getAllImageFilesInDirectory(dirPath, fileArray, relativePath = '') {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const relativeFilePath = path.join(relativePath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && isImageFile(filePath)) {
      fileArray.push({ filePath, relativeFilePath });
    } else if (stat.isDirectory()) {
      getAllImageFilesInDirectory(filePath, fileArray, relativeFilePath);
    }
  });
}

function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const ext = path.extname(filePath).toLowerCase();
  return imageExtensions.includes(ext);
}

async function compressImage(fileInfo, outputDir) {
  const { filePath, relativeFilePath } = fileInfo;
  const outputPath = path.join(outputDir, relativeFilePath);
  const ext = path.extname(filePath).toLowerCase();

  // Ensure the output directory exists before writing the file
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true });

  try {
    switch (ext) {
      case '.png':
        await sharp(filePath)
          .png()
          .toFile(outputPath);
          break;
      case '.jpeg':
      case '.jpg':
        await sharp(filePath)
          .jpeg()
          .toFile(outputPath);
        break;
      default:
        await fs.promises.cp(filePath, outputPath);
        break;
    }

    console.log(`Compressed: ${filePath} to ${outputPath}`);
  } catch (error) {
    console.error(`Error compressing ${filePath}: ${error.message}`);
  }
}

const sourceDirectory = path.resolve(__dirname, 'unprocessed');
const outputDirectory = path.resolve(__dirname, 'processed');

const imageFiles = [];
getAllImageFilesInDirectory(sourceDirectory, imageFiles);

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true });
} else {
  fs.rmdirSync(outputDirectory, { recursive: true })

  fs.mkdirSync(outputDirectory, { recursive: true });
}

imageFiles.forEach(async (fileInfo) => {
  await compressImage(fileInfo, outputDirectory);
});
