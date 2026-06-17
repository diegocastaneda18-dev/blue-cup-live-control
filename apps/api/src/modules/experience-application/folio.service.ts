import { Inject, Injectable } from "@nestjs/common";
import {
  EXPERIENCE_APPLICATION_REPOSITORY,
  type ExperienceApplicationRepository
} from "./repositories/experience-application.repository";

@Injectable()
export class FolioService {
  constructor(
    @Inject(EXPERIENCE_APPLICATION_REPOSITORY)
    private readonly repository: ExperienceApplicationRepository
  ) {}

  /** Format: LME-YYYY-0001 */
  async nextFolio(referenceDate = new Date()): Promise<string> {
    const year = referenceDate.getFullYear();
    const count = await this.repository.countByYear(year);
    const sequence = count + 1;
    return `LME-${year}-${String(sequence).padStart(4, "0")}`;
  }
}
