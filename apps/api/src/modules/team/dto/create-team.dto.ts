import { IsOptional, IsString, MinLength } from "class-validator";

export class CreateTeamDto {
  @IsString()
  tournamentId!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  captainUserId?: string;
}

