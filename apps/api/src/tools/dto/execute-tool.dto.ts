import { IsObject, IsUUID } from "class-validator";

export class ExecuteToolDto {
  @IsObject()
  input!: Record<string, unknown>;

  @IsUUID("4")
  requestId!: string;
}
