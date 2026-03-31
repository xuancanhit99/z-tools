export interface ToolExecutionHandler {
  readonly slug: string;
  execute(input: Record<string, unknown>): Record<string, unknown>;
}
