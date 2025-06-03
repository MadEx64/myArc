# myArc

A simple and efficient CLI tool for creating and extracting custom archive files.

## Overview

myArc is a TypeScript-based archiving utility that creates `.myarc` archive files. It supports archiving multiple files and directories while preserving metadata like file sizes and modification timestamps.

## Features

- **Archive Creation**: Bundle multiple files into a single `.myarc` archive
- **Archive Extraction**: Extract files from archives with preserved metadata
- **Metadata Preservation**: Maintains file modification times and directory structures
- **Custom Format**: Uses a lightweight binary format optimized for efficiency
- **CLI Interface**: Simple command-line interface with intuitive commands

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd myArc

# Install dependencies
npm install

# Build the project (optional)
npm run build
```

## Usage

### Create an Archive

Archive one or more files into a `.myarc` file:

```bash
# Archive specific files
npm run start archive file1.txt file2.txt

# Archive with custom output name
npm run start archive file1.txt file2.txt -o my-backup.myarc

# Archive all files in current directory
npm run start archive *
```

### Extract an Archive

Extract files from a `.myarc` archive:

```bash
# Extract to default directory (./extracted)
npm run start extract archive.myarc

# Extract to specific directory
npm run start extract archive.myarc -o /path/to/output
```

### Command Options

#### Archive Command
- `<files...>`: One or more files/directories to archive
- `-o, --output <file>`: Output archive filename (default: `output.myarc`)

#### Extract Command
- `<archive>`: Path to the `.myarc` file to extract
- `-o, --output <dir>`: Output directory (default: `./extracted`)

## Examples

```bash
# Create an archive from test files
npm run start archive test.txt test2.txt -o backup.myarc

# Extract the archive
npm run start extract backup.myarc -o restored-files

# Archive entire project (excluding node_modules via .gitignore patterns)
npm run start archive . -o project-backup.myarc
```

## Archive Format

The `.myarc` format uses a custom binary structure:
- **Header**: Magic bytes, version, and file count
- **File Entries**: Type, name, size, and modification timestamp for each file
- **File Data**: Raw file contents following each entry header

## Development

### Scripts
- `npm run start`: Run the CLI tool with ts-node
- `npm run build`: Compile TypeScript to JavaScript
- `npm test`: Run tests (to be implemented)

### Project Structure
- `index.ts`: Main CLI application entry point
- `modules/`: Core functionality modules
  - `archive.ts`: Archive creation logic
  - `extract.ts`: Archive extraction logic
  - `compression.ts`: Compression utilities (in development)
- `constants.ts`: Archive format constants
- `types.d.ts`: TypeScript type definitions

## Roadmap

- [ ] Directory archiving support
- [ ] Compression algorithms (RLE, LZ77, Huffman, etc.)
- [ ] Improve error handling and logging
- [ ] Progress indicators for large files
- [ ] Archive integrity verification
- [ ] File filtering and exclusion patterns
- [ ] Streaming support for large files
- [ ] Add tests

## Contributing

Contributions are welcome! Please feel free to submit issues and enhancement requests.

## License

ISC License 