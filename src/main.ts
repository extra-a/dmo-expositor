import ndjson from 'ndjson';
import { pipeline } from 'node:stream/promises';
import parseArgs from 'minimist';
import fs from 'node:fs';
import { GameReader } from './lib.js';

async function main() {
  try {
    const argv = parseArgs(process.argv.slice(2));
    const filePath = argv._[0];
    const nd = argv.ndjson;
    const isStdin = !filePath;
    const reader = new GameReader();
    await pipeline(
      isStdin ? process.stdin : fs.createReadStream(filePath),
      ndjson.parse(),
      reader.getStreamConsumer(),
    );
    const gameState = reader.getGameState(filePath);
    if (!nd) {
      console.log(JSON.stringify(gameState.getGameDescription(), null, 2));
    } else {
      console.log(JSON.stringify(gameState.getGameDescription()));
    }
  } catch (e) {
    console.error(e);
    process.exit(-1);
  }
  process.exit(0);
}

main();
