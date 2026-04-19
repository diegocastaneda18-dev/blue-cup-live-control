import { IsBoolean } from "class-validator";

export class SetOfficialDto {
  @IsBoolean()
  isOfficial!: boolean;
}

