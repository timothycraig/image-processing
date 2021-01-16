const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const imagesDir = path.resolve(__dirname, 'unprocessed')
const outputDir = path.resolve(__dirname, 'processed')

if (!fs.existsSync(outputDir)){
  fs.mkdirSync(outputDir);
} else {
  fs.rmdirSync(outputDir, { recursive: true })

  fs.mkdirSync(outputDir);
}

async function processImage (file) {
  const filePath = path.resolve(imagesDir, file)
  const thumbnailFileName = `${path.basename(file, path.extname(file))}-thumb${path.extname(file)}`

  try {
    const fullSize = await sharp(filePath)
      .resize({
        width: 600,
        height: null,
      })
      .jpeg({ quality: 90 })
      .withMetadata()
      .toFile(path.resolve(outputDir, file))

    const thumbnailSize = await sharp(filePath)
      .resize({
        width: null,
        height: 50,
      })
      .jpeg({ quality: 90 })
      .withMetadata()
      .toFile(path.resolve(outputDir, thumbnailFileName))

    console.log(fullSize, thumbnailSize)
  } catch (error) {
    console.error(error)
  }
}

(async () => {
  const files = fs.readdirSync(imagesDir)

  for (const file of files) {
    await processImage(file)
  }
})()
