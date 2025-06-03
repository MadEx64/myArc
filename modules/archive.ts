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
        const fileName = path.basename(filePath); // TODO: handle relative paths for directories (not implemented yet)
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
      const archiveHeaderBuffer = Buffer.alloc(ARCHIVE_HEADER_SIZE);
      archiveHeaderBuffer.write(ARCHIVE_MAGIC, 0);
      archiveHeaderBuffer.writeUInt8(ARCHIVE_VERSION, 5);
      archiveHeaderBuffer.writeUInt32LE(inputFilePaths.length, 6);
      await fileHandle.write(archiveHeaderBuffer);

      for (let i = 0; i < fileEntryHeaders.length; i++) {
        const header = fileEntryHeaders[i];
        const filePath = inputFilePaths[i];

        const entrySize = 1 + 2 + header.nameLength + 8 + 8;
        const entryBuffer = Buffer.alloc(entrySize);
        
        let offset = 0;
        entryBuffer.writeUInt8(header.type, offset);
        offset += 1;

        entryBuffer.writeUInt16LE(header.nameLength, offset);
        offset += 2;

        entryBuffer.write(header.name, offset, header.nameLength, 'utf-8');
        offset += header.nameLength;

        entryBuffer.writeBigUInt64LE(BigInt(header.size), offset);
        offset += 8;
        
        entryBuffer.writeBigUInt64LE(BigInt(header.lastModified), offset);
        
        await fileHandle.write(entryBuffer);

        if (header.type === 0 && header.size > 0) {
          const data = await fsPromises.readFile(filePath); // TODO: optimize this for large files (readStream)
          await fileHandle.write(data);
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