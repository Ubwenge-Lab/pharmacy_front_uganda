import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
};

// Sentry build wrap — creates the instrumentation hook automatically.
// Project: create "evuze-uganda" in the ubwenge-lab Sentry org (or reuse "evuze").
export default withSentryConfig(nextConfig, {
  org: "ubwenge-lab",
  project: "evuze-uganda",
  silent: !process.env.CI,
  widenClientFileUpload: true,
})
