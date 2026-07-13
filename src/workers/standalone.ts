/**
 * Standalone worker process entrypoint (`npm run worker`) for running the
 * image generation Worker separately from the Next.js server, matching
 * 27_DeploymentArchitecture.md's intended shape for production. Importing
 * the container wires every dependency and starts the Worker as a
 * side-effect (see generations/container.ts) -- this file only exists so
 * that side-effect can be triggered without also booting Next.js.
 */
import "@/modules/generations/container";
import { logger } from "@/shared/logging/logger";

logger.info("Image generation worker started (standalone).");
