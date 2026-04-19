import { IsOptional, IsString, MinLength } from "class-validator";

export class UpsertBoatDto {
  @IsString()
  teamId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  registry?: string;
}

