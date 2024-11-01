export class StreamHandler {
  private writer: WritableStreamDefaultWriter<any>;
  private encoder: TextEncoder;

  constructor(writer: WritableStreamDefaultWriter<any>) {
    this.writer = writer;
    this.encoder = new TextEncoder();
  }

  async sendEvent(type: string, data: any) {
    await this.writer.write(
      this.encoder.encode(`data: ${JSON.stringify({ type, data })}\n\n`)
    );
  }

  async sendError(message: string) {
    await this.sendEvent('error', { message });
  }

  async sendStatus(message: string) {
    await this.sendEvent('status', { message });
  }

  async close() {
    await this.writer.close();
  }
} 