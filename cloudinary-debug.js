// Run with: node cloudinary-raw-debug.js
// This makes a signed upload request using plain fetch, completely bypassing
// the cloudinary SDK, so we can read Cloudinary's actual raw response body
// (the SDK was swallowing it and only showing "unexpected status code - 403").

import crypto from "node:crypto";

const CLOUD_NAME = "gdzhbel1";      // your real cloud_name
const API_KEY = "158351251358379";     // your real api_key
const API_SECRET = "M8YzoRXu7sDybIw-ykO6E8z5wPc"; // your real api_secret

function buildSignature(params, apiSecret) {
  const sortedKeys = Object.keys(params).sort();
  const toSign = sortedKeys.map((k) => `${k}=${params[k]}`).join("&");
  return crypto
    .createHash("sha1")
    .update(toSign + apiSecret)
    .digest("hex");
}

async function testRawHttpUpload() {
  const timestamp = Math.floor(Date.now() / 1000);
  const paramsToSign = { timestamp, folder: "debug-test" };
  const signature = buildSignature(paramsToSign, API_SECRET);

  const form = new FormData();
  const tinyPngBase64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  const buffer = Buffer.from(tinyPngBase64, "base64");
  const blob = new Blob([buffer], { type: "image/png" });

  form.append("file", blob, "test.png");
  form.append("timestamp", String(timestamp));
  form.append("folder", "debug-test");
  form.append("api_key", API_KEY);
  form.append("signature", signature);

  const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  console.log("POSTing to:", url);

  const res = await fetch(url, {
    method: "POST",
    body: form,
  });

  console.log("HTTP status:", res.status, res.statusText);
  console.log("Response headers:");
  for (const [key, value] of res.headers.entries()) {
    console.log(`  ${key}: ${value}`);
  }

  const text = await res.text();
  console.log("\nRaw response body:");
  console.log(text);
}

testRawHttpUpload().catch((err) => {
  console.log("Script-level error (network/etc):", err);
});