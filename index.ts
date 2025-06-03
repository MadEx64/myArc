import { Command } from "commander";
import { archive } from "./modules/archive";
import { extract } from "./modules/extract";

const program = new Command();

program
  .version("0.0.1")
  .description("A simple CLI tool to archive and unarchive files");

program
  .command('archive <files...>')
  .description('Create an archive from the specified files')
  .option('-o, --output <file>', 'Output archive file', 'output.myarc')
  .action(async (files, options) => {
    try {
      await archive(files, options.output);
    } catch (err) {
      console.error('Archive creation failed:', err);
      process.exit(1);
    }
  });

program
  .command('extract <archive>')
  .description('Extract files from an archive')
  .option('-o, --output <dir>', 'Output directory', './extracted')
  .action(async (archiveFile, options) => {
    try {
      await extract(archiveFile, options.output);
    } catch (err) {
      console.error('Archive extraction failed:', err);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}