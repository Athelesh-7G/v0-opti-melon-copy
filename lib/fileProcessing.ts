export interface FileProcessResult {
  content: string | null
  url: string | null
}

export class UnifiedFileProcessor {
  processFile(buffer: Buffer, mimeType: string): FileProcessResult {
    if (mimeType.startsWith("image/")) {
      const base64 = buffer.toString("base64")
      return {
        content: null,
        url: `data:${mimeType};base64,${base64}`,
      }
    }

    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      return {
        content: buffer.toString("utf-8"),
        url: null,
      }
    }

    return {
      content: null,
      url: null,
    }
  }
}
