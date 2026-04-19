import { IsBoolean, IsISO8601, IsOptional, IsString, MinLength } from "class-validator";

export class CreateTournamentDto {
  @IsString()
  @MinLength(3)
  name!: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsISO8601()
  startsAt!: string;

  @IsISO8601()
  endsAt!: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

