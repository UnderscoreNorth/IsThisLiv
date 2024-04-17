import fs from "fs/promises";
import path from "path";
export async function clearCache() {
  let files = await fs.readdir("cache/");
  for (const file of files) {
    await fs.unlink("cache/" + file);
  }
  return {};
}
