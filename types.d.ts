export type ArchiveHeader = {
  magic: string; // 4 bytes
  version: number; // 1 byte
  fileCount: number; // 4 bytes
}

export type FileEntryHeader = {
  type: 0 | 1; // 1 byte
  name: string; // variable
  nameLength: number; // 2 bytes
  size: number; // 8 bytes
  lastModified: number; // 8 bytes
}