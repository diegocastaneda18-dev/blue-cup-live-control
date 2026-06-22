import { IsNumber, IsString, MinLength } from "class-validator";

export class ManualScoreDto {
  @IsNumber()
  adjustment!: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}
