import type { ArtifactRendererTelemetryEvent } from "@/components/kivo/generated-ui/artifact-renderer";

export const EXPERIENCE_TELEMETRY_EVENT = "ondar:experience-telemetry";

export function emitExperienceTelemetry(
  event: ArtifactRendererTelemetryEvent,
): void {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent(EXPERIENCE_TELEMETRY_EVENT, {
      detail: event,
    }),
  );
}
