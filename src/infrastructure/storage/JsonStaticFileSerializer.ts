import type {
  ExportPayload,
  StaticFileSerializer,
} from "../../domain/serialization/StaticFileSerializer";

export class JsonStaticFileSerializer implements StaticFileSerializer {
  serialize(payload: ExportPayload): string {
    return JSON.stringify(payload);
  }

  deserialize(json: string): ExportPayload {
    const raw = JSON.parse(json) as unknown;
    if (
      !raw ||
      typeof raw !== "object" ||
      !("version" in raw) ||
      (raw as ExportPayload).version !== 1
    ) {
      throw new Error("Unsupported export format or version");
    }
    const payload = raw as ExportPayload;
    if (!Array.isArray(payload.tags) || !Array.isArray(payload.works)) {
      throw new Error("Invalid export: tags and works must be arrays");
    }
    return {
      version: 1,
      tags: payload.tags,
      works: payload.works,
      exportedAt:
        typeof payload.exportedAt === "string" ? payload.exportedAt : "",
    };
  }
}
