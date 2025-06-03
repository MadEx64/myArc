import { promises as fsPromises } from "fs";
import path from "path";
import { ARCHIVE_MAGIC, ARCHIVE_HEADER_SIZE, ARCHIVE_VERSION } from "../constants";
import { FileEntryHeader } from "../types";

export async function extract(inputArchivePath: string, outputDirectoryPath: string) {
  try {
    await fsPromises.access(inputArchivePath);
    
    await fsPromises.mkdir(outputDirectoryPath, { recursive: true });

    const fileHandle = await fsPromises.open(inputArchivePath, "r");
    
    try {
      const archiveHeaderResult = await fileHandle.read(Buffer.alloc(ARCHIVE_HEADER_SIZE), 0, ARCHIVE_HEADER_SIZE, 0);
      const archiveHeaderBuffer = archiveHeaderResult.buffer;
      
      const archiveHeader = {
        magic: archiveHeaderBuffer.subarray(0, 5).toString("utf-8"),
        version: archiveHeaderBuffer.readUInt8(5),
        fileCount: archiveHeaderBuffer.readUInt32LE(6),
      };

      if (archiveHeader.magic !== ARCHIVE_MAGIC) {
        throw new Error(`Invalid archive magic: expected ${ARCHIVE_MAGIC}, got ${archiveHeader.magic}`);
      }
      if (archiveHeader.version !== ARCHIVE_VERSION) {
        throw new Error(`Unsupported archive version: ${archiveHeader.version}`);
      }

      console.log(`Extracting ${archiveHeader.fileCount} files...`);

      let currentPosition = ARCHIVE_HEADER_SIZE;

      // Read and extract each file entry sequentially (header + data)
      for (let i = 0; i < archiveHeader.fileCount; i++) {
        // Read type (1 byte) + nameLength (2 bytes) first
        const headerStart = await fileHandle.read(Buffer.alloc(3), 0, 3, currentPosition);
        const headerStartBuffer = headerStart.buffer;
        
        const type = headerStartBuffer.readUInt8(0);
        const nameLength = headerStartBuffer.readUInt16LE(1);
        currentPosition += 3;

        // Read filename
        const nameResult = await fileHandle.read(Buffer.alloc(nameLength), 0, nameLength, currentPosition);
        const name = nameResult.buffer.toString('utf-8');
        currentPosition += nameLength;

        // Read size (8 bytes) + lastModified (8 bytes)
        const metadataResult = await fileHandle.read(Buffer.alloc(16), 0, 16, currentPosition);
        const metadataBuffer = metadataResult.buffer;
        const size = Number(metadataBuffer.readBigUInt64LE(0));
        const lastModified = Number(metadataBuffer.readBigUInt64LE(8));
        currentPosition += 16;

        const fileEntryHeader: FileEntryHeader = {
          type: type as 0 | 1,
          name,
          nameLength,
          size,
          lastModified
        };

        console.log(`Found file: ${name} (${type === 0 ? 'file' : 'directory'}, ${size} bytes)`);

        // Extract the file immediately after reading its header
        const outputPath = path.join(outputDirectoryPath, fileEntryHeader.name);

        if (fileEntryHeader.type === 1) {
          // Directory
          await fsPromises.mkdir(outputPath, { recursive: true });
          console.log(`Created directory: ${outputPath}`);
        } else {
          // File
          if (fileEntryHeader.size > 0) {
            // Read file content immediately after header
            const fileDataResult = await fileHandle.read(Buffer.alloc(fileEntryHeader.size), 0, fileEntryHeader.size, currentPosition);
            const fileData = fileDataResult.buffer.subarray(0, fileDataResult.bytesRead);
            currentPosition += fileEntryHeader.size;

            await fsPromises.writeFile(outputPath, fileData);
            
            const modDate = new Date(fileEntryHeader.lastModified);
            await fsPromises.utimes(outputPath, modDate, modDate);
            
            console.log(`Extracted file: ${outputPath} (${fileEntryHeader.size} bytes)`);
          } else {
            await fsPromises.writeFile(outputPath, Buffer.alloc(0));
            console.log(`Extracted empty file: ${outputPath}`);
          }
        }
      }

      console.log("Archive extracted successfully");
    } finally {
      await fileHandle.close();
    }
  } catch (err) {
    console.error("Error extracting archive:", err);
    throw err;
  }
}