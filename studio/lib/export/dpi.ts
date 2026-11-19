/**
 * 300 DPI (High-Resolution Print & Microstock Standard) Metadata Injector
 * 
 * Injects:
 * - PNG: pHYs chunk (11,811 pixels/meter = 300 DPI)
 * - JPEG: JFIF APP0 marker (density units = 1 [dots/inch], Xdensity = 300, Ydensity = 300)
 */

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/**
 * Calculates CRC32 for PNG chunks
 */
function crc32(buf: Uint8Array): number {
  let c = ~0
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i]
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0)
    }
  }
  return ~c >>> 0
}

/**
 * Injects pHYs chunk into PNG binary data
 */
export function injectPngDpi(buffer: Uint8Array, dpi = 300): Uint8Array {
  // Check PNG signature
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (buffer[i] !== PNG_SIGNATURE[i]) return buffer
  }

  // 300 DPI = 11811 pixels per meter (300 / 0.0254)
  const ppm = Math.round(dpi / 0.0254)

  // Build pHYs chunk data: 4 bytes X, 4 bytes Y, 1 byte unit (1 = meter)
  const data = new Uint8Array(9)
  const dv = new DataView(data.buffer)
  dv.setUint32(0, ppm, false)
  dv.setUint32(4, ppm, false)
  data[8] = 1

  // Type + Data for CRC
  const typeAndData = new Uint8Array(4 + 9)
  typeAndData.set([0x70, 0x48, 0x59, 0x73], 0) // "pHYs"
  typeAndData.set(data, 4)
  const crc = crc32(typeAndData)

  // Chunk: 4 bytes length (9) + 4 bytes type ("pHYs") + 9 bytes data + 4 bytes CRC = 21 bytes
  const chunk = new Uint8Array(21)
  const chunkDv = new DataView(chunk.buffer)
  chunkDv.setUint32(0, 9, false)
  chunk.set(typeAndData, 4)
  chunkDv.setUint32(17, crc, false)

  // Find IHDR chunk (starts at offset 8, length is usually 13 + 12 = 25 bytes, so ends at offset 33)
  const ihdrLen = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength).getUint32(8, false)
  const insertPos = 8 + 4 + 4 + ihdrLen + 4 // 8 (sig) + 4 (len) + 4 (type) + ihdrLen + 4 (crc)

  // Return new buffer with pHYs inserted
  const result = new Uint8Array(buffer.length + chunk.length)
  result.set(buffer.subarray(0, insertPos), 0)
  result.set(chunk, insertPos)
  result.set(buffer.subarray(insertPos), insertPos + chunk.length)
  return result
}

/**
 * Injects JFIF APP0 (300 DPI) into JPEG binary data
 */
export function injectJpegDpi(buffer: Uint8Array, dpi = 300): Uint8Array {
  // Check SOI marker 0xFF, 0xD8
  if (buffer[0] !== 0xff || buffer[1] !== 0xd8) return buffer

  // Check if JFIF APP0 already exists
  if (buffer[2] === 0xff && buffer[3] === 0xe0) {
    const len = (buffer[4] << 8) | buffer[5]
    if (len >= 16) {
      // Check for "JFIF\0"
      if (
        buffer[6] === 0x4a &&
        buffer[7] === 0x46 &&
        buffer[8] === 0x49 &&
        buffer[9] === 0x46 &&
        buffer[10] === 0x00
      ) {
        // Mutate existing JFIF density in place
        const copy = new Uint8Array(buffer)
        copy[13] = 1 // 1 = dots per inch (DPI)
        copy[14] = (dpi >> 8) & 0xff
        copy[15] = dpi & 0xff
        copy[16] = (dpi >> 8) & 0xff
        copy[17] = dpi & 0xff
        return copy
      }
    }
  }

  // Construct standard 18-byte JFIF APP0 marker
  const jfif = new Uint8Array([
    0xff, 0xe0, // APP0 marker
    0x00, 0x10, // Length: 16 bytes
    0x4a, 0x46, 0x49, 0x46, 0x00, // "JFIF\0"
    0x01, 0x02, // Version 1.02
    0x01, // Units: 1 = dots per inch
    (dpi >> 8) & 0xff, dpi & 0xff, // Xdensity = 300
    (dpi >> 8) & 0xff, dpi & 0xff, // Ydensity = 300
    0x00, 0x00, // Thumbnail X, Y = 0
  ])

  // Insert JFIF right after SOI (offset 2)
  const result = new Uint8Array(buffer.length + jfif.length)
  result.set(buffer.subarray(0, 2), 0)
  result.set(jfif, 2)
  result.set(buffer.subarray(2), 2 + jfif.length)
  return result
}

/**
 * Injects 300 DPI metadata into a Blob
 */
export async function setDpiOnBlob(blob: Blob, dpi = 300): Promise<Blob> {
  const arrayBuffer = await blob.arrayBuffer()
  const bytes = new Uint8Array(arrayBuffer)
  if (blob.type === "image/png" || blob.type === "") {
    const withDpi = injectPngDpi(bytes, dpi)
    return new Blob([withDpi as any], { type: "image/png" })
  }
  if (blob.type === "image/jpeg") {
    const withDpi = injectJpegDpi(bytes, dpi)
    return new Blob([withDpi as any], { type: "image/jpeg" })
  }
  return blob
}
