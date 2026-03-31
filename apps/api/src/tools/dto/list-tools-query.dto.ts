import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

export class ListToolsQueryDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  search?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => (typeof value === "string" ? value.trim() : value))
  category?: string;
}
