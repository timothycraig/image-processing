const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const chalk = require('chalk')

function displayFileSize(bytes, noColor = false) {
  const kb = (bytes / 1024).toFixed(1)

  if (noColor) {
    return chalk.white(`${kb} KB`)
  }

  if (kb > 500) {
    return chalk.red(`${kb} KB`)
  } else if (kb > 250) {
    return chalk.yellow(`${kb} KB`)
  } else {
    return chalk.green(`${kb} KB`)
  }
}

function getAllImageFilesInDirectory(dirPath, fileArray, relativePath = '') {
  const files = fs.readdirSync(dirPath)

  files.forEach((file) => {
    const filePath = path.join(dirPath, file)
    const relativeFilePath = path.join(relativePath, file)
    const stat = fs.statSync(filePath)

    if (stat.isFile() && isImageFile(filePath)) {
      fileArray.push({ filePath, relativeFilePath })
    } else if (stat.isDirectory()) {
      getAllImageFilesInDirectory(filePath, fileArray, relativeFilePath)
    }
  })
}

function isImageFile(filePath) {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif']
  const ext = path.extname(filePath).toLowerCase()
  return imageExtensions.includes(ext)
}

function returnPercentChange(oldSize, newSize) {
  return Number((((oldSize - newSize) / oldSize) * 100).toFixed(1))
}

async function compressImage(fileInfo, outputDir) {
  const { filePath, relativeFilePath } = fileInfo
  const outputPath = path.join(outputDir, relativeFilePath)
  const ext = path.extname(filePath).toLowerCase()
  let wasResized = false
  let wasCompressed = true
  let origStats
  let processedStats
  let processedMeta

  // Ensure the output directory exists before writing the file
  await fs.promises.mkdir(path.dirname(outputPath), { recursive: true })

  const metadata = await sharp(filePath).metadata()

  try {
    switch (ext) {
      case '.png':
        if (metadata.width > 1920) {
          await sharp(filePath)
            .resize({
              width: 1920,
              height: null,
            })
            .png({ quality: 80 })
            .toFile(outputPath)

          wasResized = true
        } else {
          await sharp(filePath)
            .png({ quality: 80 })
            .toFile(outputPath)
        }

        origStats = await fs.promises.stat(filePath)
        processedStats = await fs.promises.stat(outputPath)
        processedMeta = await sharp(outputPath).metadata()

        if (returnPercentChange(origStats.size, processedStats.size) > 30) {
          console.log(`${displayFileSize(origStats.size)} -> ${displayFileSize(processedStats.size)}, (${returnPercentChange(origStats.size, processedStats.size)}%) [${path.basename(outputPath)}] (${processedMeta.width} X ${processedMeta.height})`)
        } else {
          await fs.promises.cp(filePath, outputPath)

          console.log(`${displayFileSize(origStats.size)} -> ${displayFileSize(origStats.size, true)} [${path.basename(outputPath)}] (${processedMeta.width} X ${processedMeta.height})`)

          wasCompressed = false
        }

        return [wasCompressed ? 1 : 0, wasResized ? 1 : 0]
      case '.jpeg':
      case '.jpg':
        if (metadata.width > 1920) {
          await sharp(filePath)
            .resize({
              width: 1920,
              height: null,
            })
            .jpeg({ quality: 80 })
            .toFile(outputPath)

          wasResized = true
        } else {
          await sharp(filePath)
            .jpeg({ quality: 80 })
            .toFile(outputPath)
        }

        origStats = await fs.promises.stat(filePath)
        processedStats = await fs.promises.stat(outputPath)
        processedMeta = await sharp(outputPath).metadata()

        if (returnPercentChange(origStats.size, processedStats.size) > 30) {
          console.log(`${displayFileSize(origStats.size)} -> ${displayFileSize(processedStats.size)}, (${returnPercentChange(origStats.size, processedStats.size)}%) [${path.basename(outputPath)}] (${processedMeta.width} X ${processedMeta.height})`)
        } else {
          await fs.promises.cp(filePath, outputPath)

          console.log(`${displayFileSize(origStats.size)} -> ${displayFileSize(origStats.size, true)} [${path.basename(outputPath)}] (${processedMeta.width} X ${processedMeta.height})`)

          wasCompressed = false
        }

        return [wasCompressed ? 1 : 0, wasResized ? 1 : 0]
      default:
        await fs.promises.cp(filePath, outputPath)

        origStats = await fs.promises.stat(filePath)
        processedMeta = await sharp(outputPath).metadata()

        console.log(`${displayFileSize(origStats.size, true)} -> ${displayFileSize(origStats.size, true)} [${path.basename(outputPath)}] (${processedMeta.width} X ${processedMeta.height})`)

        return [0, 0]
    }
  } catch (error) {
    console.error(`Error compressing ${filePath}: ${error.message}`)
  }
}

const sourceDirectory = path.resolve(__dirname, 'unprocessed')
const outputDirectory = path.resolve(__dirname, 'processed')

if (!fs.existsSync(outputDirectory)) {
  fs.mkdirSync(outputDirectory, { recursive: true })
} else {
  fs.rmSync(outputDirectory, { recursive: true })

  fs.mkdirSync(outputDirectory, { recursive: true })
}

(async () => {
  let totalNumCompressed = 0
  let totalNumResized = 0
  const imageFiles = []

  getAllImageFilesInDirectory(sourceDirectory, imageFiles)

  for (const fileInfo of imageFiles) {
    const [numCompressed, numResized] = await compressImage(fileInfo, outputDirectory)

    totalNumCompressed = totalNumCompressed + numCompressed
    totalNumResized = totalNumResized + numResized
  }

  console.log('----------------------------')
  console.log(`${imageFiles.length} Image Files Found`)
  console.log(`${totalNumCompressed} Files Compressed`)
  console.log(`${totalNumResized} Files Resized`)
  console.log('----------------------------')
})()
