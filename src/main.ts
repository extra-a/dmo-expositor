import ndjson from 'ndjson';
import { pipeline } from 'node:stream/promises';
import parseArgs from 'minimist';
import fs from 'node:fs';
import { GameReader } from './reader.js';


async function main() {
  try {
    const argv = parseArgs(process.argv.slice(2));
    const filePath = argv._[0];
    const reader = new GameReader();
    await pipeline(
      fs.createReadStream(filePath),
      ndjson.parse(),
      reader.getStreamConsumer(),
    );
    console.dir(reader.getData(), { depth: 3 });
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
  process.exit(0);
}

main();
