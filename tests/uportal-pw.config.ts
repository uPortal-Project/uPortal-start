import type { PlaywrightTestConfig } from "@playwright/test";
const config: PlaywrightTestConfig = {
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    video: "on-first-retry",
  },
  retries: 1,
};
export default config;
