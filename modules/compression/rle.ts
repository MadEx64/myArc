// maximum byte value used as escape byte, consider using 0xFE instead
const RLE_RUN_LENGTH_MARKER = 0xFF;

/**
 * Compresses data using Run Length Encoding (RLE).
 * 
 * @param data - The data to compress.
 * @returns A buffer containing the compressed data.
 * 
 * @description
 * - The RLE algorithm is a simple compression technique that replaces consecutive runs of the same byte with a single byte and a count.
 * - The minimum run length is 3, and the maximum run length is 255.
 * - If a run is longer than 255, it is split into multiple runs.
 * - The escape byte is 0xFF, which is used to indicate the start of a run.
 * - The count is the number of consecutive bytes to be repeated.
 * - The value is the byte to be repeated.
 * 
 * @example
 * const compressed = rleCompress(Buffer.from("AAAAABBBCCDAA"));
 * console.log(compressed.toString()); // Output: 0xFF 65 61 0xFF 62 62 0xFF 63 63 0xFF 64 61 0xFF 61 61
 */
export function rleCompress(data: Buffer): Buffer {
  if (data.length === 0) return Buffer.alloc(0);
  
  const result: number[] = [];
  let count = 1;
  let currentByte = data[0];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i] === currentByte && count < 255) {
      count++;
    } else {
      addRunLengthMarker(result, count, currentByte);
      currentByte = data[i];
      count = 1;
    }
  }
  
  addRunLengthMarker(result, count, currentByte);
  
  return Buffer.from(result);
}

/**
 * Decompresses data using Run Length Encoding (RLE).
 * 
 * @param data - The data to decompress.
 * @returns A buffer containing the decompressed data.
 * 
 * @example
 * const decompressed = rleDecompress(Buffer.from("0xFF 65 61 0xFF 62 62 0xFF 63 63 0xFF 64 61 0xFF 61 61"));
 * console.log(decompressed.toString()); // Output: AAAAAABBBCCDAA
 */
export function rleDecompress(data: Buffer): Buffer {
  if (data.length === 0) return Buffer.alloc(0);

  const result: number[] = [];
  let i = 0;

  while (i < data.length) {
    const byte = data[i];

    if (byte === RLE_RUN_LENGTH_MARKER) {
      if (data[i + 1] === RLE_RUN_LENGTH_MARKER && i + 1 < data.length) {
        result.push(RLE_RUN_LENGTH_MARKER);
        i += 2;
      } else if (i + 2 < data.length) {
        const count = data[i + 1];
        const value = data[i + 2];
        for (let j = 0; j < count; j++) {
          result.push(value);
        }
        i += 3;
      } else {
        throw new Error("Invalid compressed data");
      }
    } else {
      result.push(byte);
      i++;
    }
  }

  return Buffer.from(result);
}

/**
 * Adds a run length marker to the result array.
 * 
 * @param result - The result array.
 * @param count - The count of the run.
 * @param value - The value of the run.
 */
function addRunLengthMarker(result: number[], count: number, value: number) {
  if (count >= 3) {
    result.push(RLE_RUN_LENGTH_MARKER, count, value);
  } else {
    for (let j = 0; j < count; j++) {
      if (value === RLE_RUN_LENGTH_MARKER) {
        result.push(RLE_RUN_LENGTH_MARKER, value);
      } else {
        result.push(value);
      }
    }
  }
} 