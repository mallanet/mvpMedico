import { defineCloudflareConfig } from "@opennextjs/cloudflare";

/** Preview / review deploy: no R2/KV cache bindings required. */
export default defineCloudflareConfig({
  incrementalCache: "dummy",
  tagCache: "dummy",
  queue: "direct",
});
