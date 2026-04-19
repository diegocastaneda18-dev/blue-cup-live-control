import { IsIn, IsISO8601, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";
import type { CatchType } from "@bluecup/types";

export class SubmitCatchDto {
  @IsString()
  tournamentId!: string;

  @IsString()
  categoryId!: string;

  @IsOptional()
  @IsString()
  speciesId?: string;

  @IsIn(["release", "weigh_in"] satisfies CatchType[])
  type!: CatchType;

  @IsOptional()
  @IsISO8601()
  occurredAtClient?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(500)
  weightKg?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000)
  lengthCm?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

