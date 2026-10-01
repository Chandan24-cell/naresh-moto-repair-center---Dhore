import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_SRC_DIR = '/Users/chandankumarsah/Documents/BIKE TRANSITION';
const BASE_DEST_DIR = path.resolve(__dirname, '../public/bike-frames');
const TMP_DIR = path.resolve(__dirname, '../tmp');

const BIKES = [
  { folder: 'Ducati Monster', slug: 'ducati-monster', targetFrames: 240 },
  { folder: 'BMW R 1250 GS', slug: 'bmw-r1250gs', targetFrames: 240 },
  { folder: 'Triumph model', slug: 'triumph-street-triple', targetFrames: 300 },
  { folder: 'Harley-Davidson', slug: 'harley-davidson', targetFrames: 300 }
];

async function findSourceFolder(bikeDir) {
  const upscaled = path.join(bikeDir, 'frames_upscaled');
  const raw = path.join(bikeDir, 'frames_raw');
  
  try {
    const stats = await fs.stat(upscaled);
    if (stats.isDirectory()) return upscaled;
  } catch (e) {}
  
  try {
    const stats = await fs.stat(raw);
    if (stats.isDirectory()) return raw;
  } catch (e) {}
  
  return bikeDir;
}

async function measureWatermark(imagePath, imgW, imgH) {
  // Analyze bottom-right 15% x 15% region
  const searchW = Math.floor(imgW * 0.15);
  const searchH = Math.floor(imgH * 0.15);
  const left = imgW - searchW;
  const top = imgH - searchH;

  const { data, info } = await sharp(imagePath)
    .extract({ left, top, width: searchW, height: searchH })
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = searchW;
  let minY = searchH;
  let hasWatermark = false;

  for (let y = 0; y < searchH; y++) {
    for (let x = 0; x < searchW; x++) {
      const idx = (y * searchW + x) * info.channels;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      if (r > 150 && g > 150 && b > 150) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        hasWatermark = true;
      }
    }
  }

  if (!hasWatermark) {
    return { cropPct: 0 };
  }

  const cropPixelsW = searchW - minX;
  const cropPixelsH = searchH - minY;
  
  // Add 2% safety margin to the whole image size
  const cropPctW = (cropPixelsW / imgW) + 0.02;
  const cropPctH = (cropPixelsH / imgH) + 0.02;

  const cropPct = Math.max(cropPctW, cropPctH);
  return { cropPct };
}

async function processFrames() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  
  const summary = [];
  
  for (const bike of BIKES) {
    console.log(`\nProcessing ${bike.slug}...`);
    const sourceBikeDir = path.join(BASE_SRC_DIR, bike.folder);
    const srcFolder = await findSourceFolder(sourceBikeDir);
    
    let files = await fs.readdir(srcFolder);
    files = files.filter(f => f.match(/ezgif-frame-\d+\.jpg$/i))
                 .sort((a, b) => {
                   const numA = parseInt(a.match(/\d+/)[0]);
                   const numB = parseInt(b.match(/\d+/)[0]);
                   return numA - numB;
                 });
                 
    if (files.length === 0) {
      console.warn(`⚠️  No frames found for ${bike.slug} in ${srcFolder}`);
      continue;
    }

    const filesToProcess = files.slice(0, bike.targetFrames);
    
    const firstFrame = path.join(srcFolder, filesToProcess[0]);
    const midFrame = path.join(srcFolder, filesToProcess[Math.floor(filesToProcess.length / 2)]);
    const lastFrame = path.join(srcFolder, filesToProcess[filesToProcess.length - 1]);
    
    const metadata = await sharp(firstFrame).metadata();
    const { width, height } = metadata;
    
    const ms1 = await measureWatermark(firstFrame, width, height);
    const ms2 = await measureWatermark(midFrame, width, height);
    const ms3 = await measureWatermark(lastFrame, width, height);
    
    const maxCropPct = Math.max(ms1.cropPct, ms2.cropPct, ms3.cropPct);
    
    const cropW = Math.ceil(width * maxCropPct);
    const cropH = Math.ceil(height * maxCropPct);
    
    const extractRegion = {
      left: 0,
      top: 0,
      width: width - cropW,
      height: height - cropH
    };

    console.log(`Measured crop: ${(maxCropPct * 100).toFixed(2)}% (W: -${cropW}px, H: -${cropH}px)`);

    const destLgDir = path.join(BASE_DEST_DIR, bike.slug, 'lg');
    const destSmDir = path.join(BASE_DEST_DIR, bike.slug, 'sm');
    await fs.mkdir(destLgDir, { recursive: true });
    await fs.mkdir(destSmDir, { recursive: true });

    let totalBytesLg = 0;
    let totalBytesSm = 0;

    for (let i = 0; i < filesToProcess.length; i++) {
      const srcPath = path.join(srcFolder, filesToProcess[i]);
      const frameNum = String(i + 1).padStart(4, '0');
      
      const outLg = path.join(destLgDir, `frame-${frameNum}.webp`);
      const outSm = path.join(destSmDir, `frame-${frameNum}.webp`);
      
      const croppedBuffer = await sharp(srcPath)
        .extract(extractRegion)
        .toBuffer();
        
      const infoLg = await sharp(croppedBuffer)
        .resize(1920, 1080, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .sharpen({ sigma: 0.6 })
        .webp({ quality: 82 })
        .toFile(outLg);
      totalBytesLg += infoLg.size;

      const infoSm = await sharp(croppedBuffer)
        .resize(960, 540, { fit: 'fill', kernel: sharp.kernel.lanczos3 })
        .sharpen({ sigma: 0.6 })
        .webp({ quality: 75 })
        .toFile(outSm);
      totalBytesSm += infoSm.size;
      
      if (i % 50 === 0) {
        process.stdout.write('.');
      }
    }
    console.log(' Done!');

    const compositeFrames = [filesToProcess[0], filesToProcess[Math.floor(filesToProcess.length / 2)], filesToProcess[filesToProcess.length - 1]];
    const composites = [];
    
    for (let i = 0; i < compositeFrames.length; i++) {
      const src = path.join(srcFolder, compositeFrames[i]);
      const cropped = await sharp(src).extract(extractRegion).resize(960, 540).toBuffer();
      const croppedMeta = await sharp(cropped).metadata();
      const zoomed = await sharp(cropped)
        .extract({
          left: croppedMeta.width - 200,
          top: croppedMeta.height - 200,
          width: 200,
          height: 200
        })
        .resize(960, 540, { kernel: sharp.kernel.nearest })
        .toBuffer();
        
      composites.push({ input: cropped, left: i * 960, top: 0 });
      composites.push({ input: zoomed, left: i * 960, top: 540 });
    }

    await sharp({
      create: { width: 2880, height: 1080, channels: 3, background: { r: 0, g: 0, b: 0 } }
    })
    .composite(composites)
    .jpeg({ quality: 80 })
    .toFile(path.join(TMP_DIR, `contact_${bike.slug}.jpg`));

    summary.push({
      Bike: bike.slug,
      Frames: filesToProcess.length,
      'Crop %': (maxCropPct * 100).toFixed(2) + '%',
      'LG Size (MB)': (totalBytesLg / (1024 * 1024)).toFixed(2),
      'SM Size (MB)': (totalBytesSm / (1024 * 1024)).toFixed(2)
    });
  }

  console.log('\n--- SUMMARY ---');
  console.table(summary);
}

processFrames().catch(console.error);
