import { IsIn, IsString, IsUrl } from "class-validator";
import type { MediaType } from "@bluecup/types";

export class AddCatchMediaDto {
  @IsString()
  catchId!: string;

  @IsIn(["photo", "video"] satisfies MediaType[])
  type!: MediaType;

  @IsString()
  objectKey!: string;

  @IsUrl()
  url!: string;
}

