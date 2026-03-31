import { Transform } from "class-transformer";
import { IsArray, IsBoolean, IsObject, IsOptional, IsString } from "class-validator";

export class CreateAdminToolDto {
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  slug!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  name!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  description!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  category!: string;

  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  instructions!: string;

  @IsArray()
  @IsObject({ each: true })
  inputSchema!: Record<string, unknown>[];

  @IsObject()
  outputSchema!: Record<string, unknown>;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
