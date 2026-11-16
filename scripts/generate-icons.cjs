const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      const pixelOffset = rowOffset + 1 + x * 4;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let table = new Int32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0))
  ]);
}

function renderGbIcon(x, y, w, h) {
  const normX = x / w;
  const normY = y / h;

  // Outer border with rounded squircle
  const cornerR = 0.22;
  let inSquircle = true;
  if (normX < cornerR && normY < cornerR) {
    inSquircle = (normX - cornerR)**2 + (normY - cornerR)**2 <= cornerR**2;
  } else if (normX > 1 - cornerR && normY < cornerR) {
    inSquircle = (normX - (1 - cornerR))**2 + (normY - cornerR)**2 <= cornerR**2;
  } else if (normX < cornerR && normY > 1 - cornerR) {
    inSquircle = (normX - cornerR)**2 + (normY - (1 - cornerR))**2 <= cornerR**2;
  } else if (normX > 1 - cornerR && normY > 1 - cornerR) {
    inSquircle = (normX - (1 - cornerR))**2 + (normY - (1 - cornerR))**2 <= cornerR**2;
  }
  if (!inSquircle) return [0, 0, 0, 0];

  // Gold border edge
  const isEdge = normX < 0.03 || normX > 0.97 || normY < 0.03 || normY > 0.97;
  if (isEdge) return [245, 158, 11, 180]; // Subtle amber border

  // Roof triangle (Construction apex)
  // Apex at (0.50, 0.20), base from (0.16, 0.44) to (0.84, 0.44)
  const roofApexY = 0.18;
  const roofBaseY = 0.42;
  const roofSlope = (roofBaseY - roofApexY) / 0.34; // slope ~ 0.70
  const distFromCenter = Math.abs(normX - 0.50);
  const expectedY = roofApexY + distFromCenter * roofSlope;
  
  if (normY >= expectedY - 0.035 && normY <= expectedY + 0.025 && normX >= 0.16 && normX <= 0.84) {
    // Roof truss line (Bright Amber Gold)
    return [251, 191, 36, 255];
  }

  // Building pillars & blocks
  // Left building: x: 0.30 - 0.42, y: 0.44 - 0.68
  // Center high building: x: 0.44 - 0.58, y: 0.36 - 0.68
  // Right building: x: 0.60 - 0.72, y: 0.44 - 0.68
  const inLeftBldg = normX >= 0.28 && normX <= 0.42 && normY >= 0.44 && normY <= 0.68;
  const inCenterBldg = normX >= 0.44 && normX <= 0.56 && normY >= 0.34 && normY <= 0.68;
  const inRightBldg = normX >= 0.58 && normX <= 0.72 && normY >= 0.44 && normY <= 0.68;

  if (inLeftBldg || inCenterBldg || inRightBldg) {
    // Windows in buildings (Dark slate cutouts)
    const winX = (normX * 100) % 6;
    const winY = (normY * 100) % 8;
    const isWindow = winX >= 2 && winX <= 4 && winY >= 2 && winY <= 5;
    if (isWindow) return [11, 15, 25, 255]; // Dark background window
    return [245, 158, 11, 255]; // Amber 500 building face
  }

  // Bottom Base Bar
  if (normY >= 0.69 && normY <= 0.73 && normX >= 0.24 && normX <= 0.76) {
    return [217, 119, 6, 255];
  }

  // "GB" emblem area at the bottom: normY from 0.76 to 0.90
  // Letter 'G' (normX: 0.30 - 0.46)
  const inG_vertical = normX >= 0.30 && normX <= 0.34 && normY >= 0.76 && normY <= 0.90;
  const inG_top = normX >= 0.30 && normX <= 0.46 && normY >= 0.76 && normY <= 0.80;
  const inG_bottom = normX >= 0.30 && normX <= 0.46 && normY >= 0.86 && normY <= 0.90;
  const inG_right_lower = normX >= 0.42 && normX <= 0.46 && normY >= 0.83 && normY <= 0.90;
  const inG_cross = normX >= 0.37 && normX <= 0.46 && normY >= 0.83 && normY <= 0.86;

  // Letter 'B' (normX: 0.54 - 0.70)
  const inB_vertical = normX >= 0.54 && normX <= 0.58 && normY >= 0.76 && normY <= 0.90;
  const inB_top = normX >= 0.54 && normX <= 0.68 && normY >= 0.76 && normY <= 0.80;
  const inB_mid = normX >= 0.54 && normX <= 0.67 && normY >= 0.81 && normY <= 0.85;
  const inB_bottom = normX >= 0.54 && normX <= 0.68 && normY >= 0.86 && normY <= 0.90;
  const inB_curve1 = normX >= 0.65 && normX <= 0.69 && normY >= 0.77 && normY <= 0.84;
  const inB_curve2 = normX >= 0.65 && normX <= 0.70 && normY >= 0.82 && normY <= 0.89;

  if (inG_vertical || inG_top || inG_bottom || inG_right_lower || inG_cross ||
      inB_vertical || inB_top || inB_mid || inB_bottom || inB_curve1 || inB_curve2) {
    return [251, 191, 36, 255]; // Brilliant Amber 400
  }

  // Dark slate background #0b0f19
  return [11, 15, 25, 255];
}

const outDir = path.join(__dirname, '..', 'public');
const png192 = createPng(192, 192, renderGbIcon);
const png512 = createPng(512, 512, renderGbIcon);

fs.writeFileSync(path.join(outDir, 'icon-192.png'), png192);
fs.writeFileSync(path.join(outDir, 'icon-512.png'), png512);

console.log('Generated icon-192.png (' + png192.length + ' bytes) and icon-512.png (' + png512.length + ' bytes)');
