// Publishes an over-the-air update that the installed builds will take.
//
// Builds are made from a copy whose app.json sets updates.requestHeaders to the channel (see CLAUDE.md), and that
// header is part of the runtime fingerprint. A plain `eas update` hashes app.json without it, so its runtime version
// matches no installed app. This sets the same header for each channel while `eas update` runs, then puts app.json back.
//
//   node scripts/ota.mjs "What changed"              both channels: preview (GitHub, F-Droid), then production (Play)
//   node scripts/ota.mjs "What changed" preview      one channel
//
// The export goes to .expo/ota (ignored by git), not eas's default dist/, which it empties first: dist/ holds the APKs.
//
// Only for JavaScript changes: after a native change (a library, a plugin, app.json, a font), make new builds instead.

import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const [message, only] = process.argv.slice(2);
if (!message) {
  console.error('Usage: node scripts/ota.mjs "message" [preview|production]');
  process.exit(1);
}
const channels = only ? [only] : ['preview', 'production'];
const original = readFileSync('app.json', 'utf8');
const win = process.platform === 'win32';
const run = (args) => spawnSync('npx', args, { stdio: 'inherit', shell: win }).status;

let failed = false;
try {
  for (const channel of channels) {
    const app = JSON.parse(original);
    app.expo.updates = { ...app.expo.updates, requestHeaders: { 'expo-channel-name': channel } };
    writeFileSync('app.json', JSON.stringify(app, null, 2) + '\n');
    console.log(`\n${channel}: publishing for the builds that listen on it`);
    if (run(['eas-cli', 'update', '--channel', channel, '--environment', channel, '--platform', 'android', '--input-dir', '.expo/ota', '--message', win ? JSON.stringify(message) : message]) !== 0) {
      failed = true;
      break;
    }
  }
} finally {
  writeFileSync('app.json', original);
}
process.exit(failed ? 1 : 0);
