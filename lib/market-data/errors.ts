export class ProviderUnavailableError extends Error {
  constructor(providerName: string, reason?: string) {
    super(
      `${providerName} is not available${reason ? `: ${reason}` : ". Check environment variables."}`
    );
    this.name = "ProviderUnavailableError";
  }
}

export class SnapshotGenerationError extends Error {
  constructor(
    message: string,
    public readonly stage: "fetch" | "normalize" | "interpret" | "build" | "persist"
  ) {
    super(message);
    this.name = "SnapshotGenerationError";
  }
}
