#!/usr/bin/env node
/**
 * Tăng phiên bản APK: 1.0 → 1.1 → 1.2
 * node scripts/bump-apk-version.mjs [ghi chú]
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const file = "src/lib/app-version.ts";
let src = readFileSync(file, "utf8");
const match = src.match(/export const APP_VERSION = "(\d+)\.(\d+)"/);
if (!match) {
  console.error("Không đọc được APP_VERSION");
  process.exit(1);
}
const major = Number(match[1]);
const minor = Number(match[2]) + 1;
const version = `${major}.${minor}`;
const build = `RVver${version}`;
const date = new Date().toISOString().slice(0, 10);
const note = process.argv.slice(2).join(" ").trim() || "Bản APK mới";

src = src.replace(/export const APP_VERSION = "[^"]+"/, `export const APP_VERSION = "${version}"`);
src = src.replace(/export const APP_BUILD = "[^"]+"/, `export const APP_BUILD = "${build}"`);
src = src.replace(/export const APP_RELEASED = "[^"]+"/, `export const APP_RELEASED = "${date}"`);

const entry = `  {
    version: "${version}",
    build: "${build}",
    date: "${date}",
    notes: [
      ${JSON.stringify(note)},
    ],
  },
`;
src = src.replace(/\] = \[\n/, `] = [\n${entry}`);
writeFileSync(file, src);

const yml = "/tmp/apk-edit/apktool.yml";
if (existsSync(yml)) {
  let y = readFileSync(yml, "utf8");
  y = y.replace(/versionCode: \d+/, `versionCode: ${minor + 1}`);
  y = y.replace(/versionName: [\d.]+/, `versionName: ${version}`);
  writeFileSync(yml, y);
}

console.log(version, build);
