import { IsIn, IsString, MinLength } from "class-validator";
import type { MediaType } from "@bluecup/types";

export class AddCatchMediaDto {
  @IsString()
  catchId!: string;

  @IsIn(["photo", "video"] satisfies MediaType[])
  type!: MediaType;

  @IsString()
  objectKey!: string;

  @IsString()
  @MinLength(8)
  url!: string;
}

