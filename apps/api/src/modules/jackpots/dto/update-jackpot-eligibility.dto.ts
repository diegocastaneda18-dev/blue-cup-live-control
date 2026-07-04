import { IsBoolean, IsString, IsUUID } from "class-validator";

export class UpdateJackpotEligibilityDto {
  @IsUUID()
  tournamentId!: string;

  @IsUUID()
  teamId!: string;

  @IsString()
  category!: string;

  @IsBoolean()
  isEligible!: boolean;
}
