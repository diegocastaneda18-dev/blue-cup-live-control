import { IsBoolean } from "class-validator";

export class UpdateTeamSonarDto {
  @IsBoolean()
  usesSonar!: boolean;
}
