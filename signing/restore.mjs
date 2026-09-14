#!/usr/bin/env node
/**
 * Khóa ký APK bản 1.26+ (CN=Dang Nguyen).
 *   node signing/restore.mjs        — khôi phục keystore local (gitignore)
 *   node signing/restore.mjs pack   — gói keystore hiện có vào signing/release.json
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PACK = join(ROOT, "signing/release.json");
const KS = join(ROOT, ".rung-vang-release.keystore");
const PASS = join(ROOT, ".keystore.pass");
const CERT = "E70FB9C064798767CCDE339CD04D13361BCE07BACFD20C653EAA2765A1E06F61";
const MASK = Buffer.from(CERT, "hex");

function xor(buf) {
  const out = Buffer.from(buf);
  for (let i = 0; i < out.length; i++) out[i] ^= MASK[i % MASK.length];
  return out;
}

function pack() {
  if (!existsSync(KS) || !existsSync(PASS)) {
    console.error("Thiếu .rung-vang-release.keystore hoặc .keystore.pass");
    process.exit(1);
  }
  const keystore = readFileSync(KS);
  const password = readFileSync(PASS);
  const body = Buffer.concat([
    Buffer.from([keystore.length >> 8, keystore.length & 255]),
    keystore,
    password,
  ]);
  const json = {
    format: "rungvang-sign-v1",
    alias: "rungvang",
    package: "vn.rungvang.app",
    signer: "CN=Dang Nguyen",
    certSha256: CERT,
    blob: xor(body).toString("base64"),
  };
  writeFileSync(PACK, `${JSON.stringify(json, null, 2)}\n`);
  console.log("wrote signing/release.json", keystore.length, "bytes");
}

function restore() {
  if (!existsSync(PACK)) {
    console.error("Thiếu signing/release.json");
    process.exit(1);
  }
  const json = JSON.parse(readFileSync(PACK, "utf8"));
  if (json.format !== "rungvang-sign-v1" || json.certSha256 !== CERT) {
    console.error("Gói chữ ký không khớp vân tay bản 1.26");
    process.exit(1);
  }
  const body = xor(Buffer.from(json.blob, "base64"));
  const ksLen = (body[0] << 8) | body[1];
  const keystore = body.subarray(2, 2 + ksLen);
  const password = body.subarray(2 + ksLen);
  writeFileSync(KS, keystore);
  writeFileSync(PASS, password);
  try {
    writeFileSync(join(ROOT, "rung-vang.keystore"), keystore);
  } catch {
    /* ignore */
  }
  console.log("restored signing key", json.signer, json.certSha256.slice(0, 12) + "…");
}

if (process.argv[2] === "pack") pack();
else restore();
