import { Type } from "class-transformer";
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import type { MediaType } from "@bluecup/types";

export class InitMediaUploadDto {
  @IsString()
  catchId!: string;

  @IsIn(["photo", "video"] satisfies MediaType[])
  type!: MediaType;

  @IsString()
  mimeType!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(536870912)
  sizeBytes!: number;

  @IsOptional()
  @IsString()
  fileName?: string;
}

export class PresignUploadPartsDto {
  @Type(() => Number)
  @IsInt({ each: true })
  @Min(1, { each: true })
  partNumbers!: number[];
}

export class CompleteUploadPartDto {
  @IsInt()
  @Min(1)
  partNumber!: number;

  @IsString()
  etag!: string;
}

export class CompleteMediaUploadDto {
  @IsOptional()
  parts?: CompleteUploadPartDto[];
}
