import { writeFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const name = Buffer.from(type);
  const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
  const checksum = Buffer.alloc(4); checksum.writeUInt32BE(crc32(Buffer.concat([name, data])));
  return Buffer.concat([length, name, data, checksum]);
}

function insideShield(x, y, size) {
  const nx = x / size; const ny = y / size;
  if (ny < .18 || ny > .84) return false;
  const half = ny < .55 ? .27 : .27 * (1 - (ny - .55) / .32);
  return Math.abs(nx - .5) < Math.max(.04, half);
}

function onCheck(x, y, size) {
  const nx = x / size; const ny = y / size;
  const segment = (ax, ay, bx, by) => {
    const dx = bx - ax; const dy = by - ay;
    const t = Math.max(0, Math.min(1, ((nx - ax) * dx + (ny - ay) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(nx - (ax + t * dx), ny - (ay + t * dy)) < .035;
  };
  return segment(.38, .49, .47, .59) || segment(.47, .59, .65, .38);
}

async function createIcon(size, path) {
  const stride = size * 4 + 1; const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = y * stride + 1 + x * 4;
      const color = onCheck(x, y, size) ? [17, 17, 20] : insideShield(x, y, size) ? [255, 255, 255] : [255, 107, 0];
      raw.set([...color, 255], offset);
    }
  }
  const header = Buffer.alloc(13); header.writeUInt32BE(size, 0); header.writeUInt32BE(size, 4); header.set([8, 6, 0, 0, 0], 8);
  const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', header), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
  await writeFile(path, png);
}

await createIcon(192, new URL('../assets/icon-192.png', import.meta.url));
await createIcon(512, new URL('../assets/icon-512.png', import.meta.url));
