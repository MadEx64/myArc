import { promises as fsPromises } from "fs";
import path from "path";
import { FileEntryHeader } from "../types";
import { ARCHIVE_HEADER_SIZE, ARCHIVE_MAGIC, ARCHIVE_VERSION } from "../constants";

export async function archive(inputFilePaths: string[], outputArchivePath: string) {
  try {
    await Promise.all(inputFilePaths.map(filePath => fsPromises.access(filePath)));

    const fileEntryHeaders = await Promise.all(
      inputFilePaths.map(async (filePath) => {
        const stats = await fsPromises.stat(filePath);
        const fileName = path.basename(filePath);
        if (!fileName) throw new Error(`Invalid file path: ${filePath}`);
        
        return {
          type: stats.isDirectory() ? 1 : 0,
          name: fileName,
          nameLength: Buffer.byteLength(fileName, 'utf-8'),
          size: stats.isDirectory() ? 0 : stats.size,
          lastModified: stats.mtime.getTime()
        } as FileEntryHeader;
      })
    );

    const fileHandle = await fsPromises.open(outputArchivePath, 'w');
    
    try {
      // Write archive header (fixed size: 13 bytes)
      const archiveHeaderBuffer = Buffer.alloc(ARCHIVE_HEADER_SIZE);
      archiveHeaderBuffer.write(ARCHIVE_MAGIC, 0); // 4 bytes
      archiveHeaderBuffer.writeUInt8(ARCHIVE_VERSION, 4); // 1 byte
      archiveHeaderBuffer.writeUInt32LE(inputFilePaths.length, 5); // 4 bytes
      await fileHandle.write(archiveHeaderBuffer);

      // Write file entry headers (variable size)
      for (const header of fileEntryHeaders) {
        const entrySize = 1 + 2 + header.nameLength + 8 + 8;
        const entryBuffer = Buffer.alloc(entrySize);
        
        let offset = 0;
        entryBuffer.writeUInt8(header.type, offset); // write the type
        offset += 1;

        entryBuffer.writeUInt16LE(header.nameLength, offset); // write the name length
        offset += 2;

        entryBuffer.write(header.name, offset, header.nameLength, 'utf-8'); // write the name (encoded in utf-8)
        offset += header.nameLength;

        entryBuffer.writeBigUInt64LE(BigInt(header.size), offset); // write the size
        offset += 8;
        
        entryBuffer.writeBigUInt64LE(BigInt(header.lastModified), offset); // write the last modified
        
        await fileHandle.write(entryBuffer);
      }

      // Write file contents
      for(let i = 0; i < inputFilePaths.length; i++) {
        const filePath = inputFilePaths[i];
        const header = fileEntryHeaders[i];
        if (header.type === 0) {
          const data = await fsPromises.readFile(filePath);
          await fileHandle.write(data);
        } else {
          // TODO: handle directories
        }
      }
      
      console.log("Archive created successfully");
    } finally {
      await fileHandle.close();
    }
  } catch (err) {
    console.error("Error creating archive:", err);
    throw err;
  }
}