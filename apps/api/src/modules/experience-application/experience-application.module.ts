import { Logger, Module, OnModuleInit } from "@nestjs/common";

import { AdminAccessController } from "./admin-access.controller";

import { ExperienceApplicationController } from "./experience-application.controller";

import { ExperienceApplicationEmailService } from "./experience-application-email.service";

import { ExperienceApplicationService } from "./experience-application.service";

import {

  getAdminAuthMode,

  getExperienceStorageDriver

} from "./config/experience.config";

import { AdminAccessGuard } from "./guards/admin-access.guard";

import { getSupabaseAdminClient } from "./lib/supabase-admin.client";

import { FolioService } from "./folio.service";

import { EXPERIENCE_APPLICATION_REPOSITORY } from "./repositories/experience-application.repository";

import { FileExperienceApplicationRepository } from "./repositories/file-experience-application.repository";

import { SupabaseExperienceApplicationRepository } from "./repositories/supabase-experience-application.repository";

import { EXPERIENCE_STORAGE } from "./storage/experience-storage.interface";

import { FileExperienceStorageService } from "./storage/file-experience-storage.service";

import { SupabaseExperienceStorageService } from "./storage/supabase-experience-storage.service";



const storageDriver = getExperienceStorageDriver();

const useSupabase = storageDriver === "supabase";



@Module({

  controllers: [ExperienceApplicationController, AdminAccessController],

  providers: [

    ExperienceApplicationService,

    ExperienceApplicationEmailService,

    FolioService,

    AdminAccessGuard,

    {

      provide: EXPERIENCE_APPLICATION_REPOSITORY,

      useClass: useSupabase

        ? SupabaseExperienceApplicationRepository

        : FileExperienceApplicationRepository

    },

    {

      provide: EXPERIENCE_STORAGE,

      useClass: useSupabase ? SupabaseExperienceStorageService : FileExperienceStorageService

    }

  ],

  exports: [ExperienceApplicationService]

})

export class ExperienceApplicationModule implements OnModuleInit {

  private readonly logger = new Logger(ExperienceApplicationModule.name);



  onModuleInit(): void {

    const authMode = getAdminAuthMode();

    this.logger.log(

      `Las Marías Experience — storage=${storageDriver}, adminAuth=${authMode}`

    );



    if (!useSupabase) return;



    try {

      getSupabaseAdminClient();

      this.logger.log("[Experience Supabase] staging mode ready (Database + Storage)");

    } catch {

      this.logger.error(

        "[Experience Supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"

      );

    }

  }

}


