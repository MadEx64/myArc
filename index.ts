// TODO:
// Handle CLI arguments and options, ochestrate the main application flow
import { Command } from "commander";

const program = new Command();

program
  .version("0.0.1")
  .description("A simple CLI tool to archive and unarchive files");

program.parse(process.argv);

const args = program.args;

if (args.length < 2) {
  console.error("Usage: myarc <command> <options>");
  process.exit(1);
}

const command = args[0];