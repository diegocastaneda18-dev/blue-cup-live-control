import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import type { ReviewAction } from "@bluecup/types";

export class ReviewActionDto {
  @IsIn(["approve", "reject", "request_more_evidence", "penalize"] satisfies ReviewAction[])
  action!: ReviewAction;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100000)
  penaltyPoints?: number;
}

