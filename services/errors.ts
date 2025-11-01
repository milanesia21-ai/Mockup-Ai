
export class GeminiError extends Error {
  public code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = 'GeminiError';
    this.code = code;
  }
}
