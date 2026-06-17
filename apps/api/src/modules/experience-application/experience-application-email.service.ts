import { Injectable, Logger } from "@nestjs/common";

import type {

  ExperienceApplicationDocument,

  ExperienceApplicationRecord

} from "@bluecup/types";

import { isExperienceEmailEnabled, getExperienceWebBaseUrl } from "./config/experience.config";



type SendEmailInput = {

  to: string | string[];

  subject: string;

  html: string;

};



@Injectable()

export class ExperienceApplicationEmailService {

  private readonly logger = new Logger(ExperienceApplicationEmailService.name);



  async sendAfterCreate(application: ExperienceApplicationRecord): Promise<void> {

    if (!isExperienceEmailEnabled()) return;



    const folio = application.folio;

    const clientHtml = `

      <p>Hola ${application.applicant.fullName},</p>

      <p>Recibimos tu solicitud Las Marías Experience.</p>

      <p><strong>Folio:</strong> ${folio}</p>

      <p>Fecha de ingreso: ${application.itinerary.arrivalDate}</p>

      <p>Guarda tu folio para dar seguimiento.</p>

    `;



    await this.send({

      to: application.applicant.email,

      subject: `Solicitud recibida — ${folio}`,

      html: clientHtml

    });



    const internalTo = process.env.EXPERIENCE_EMAIL_INTERNAL_TO?.trim();

    if (internalTo) {

      await this.send({

        to: internalTo,

        subject: `[Admin] Nueva solicitud ${folio}`,

        html: `<p>Nueva solicitud de ${application.applicant.fullName} (${application.applicant.email}).</p>`

      });

    }

  }



  async sendAfterDocumentReview(

    application: ExperienceApplicationRecord,

    document: ExperienceApplicationDocument

  ): Promise<void> {

    if (!isExperienceEmailEnabled()) return;

    if (document.status !== "rechazado" && document.status !== "incompleto") return;



    const webBase = getExperienceWebBaseUrl();

    await this.send({

      to: application.applicant.email,

      subject: `Acción requerida — documento ${document.label}`,

      html: `

        <p>Hola ${application.applicant.fullName},</p>

        <p>Revisamos el documento <strong>${document.label}</strong> de tu solicitud ${application.folio}.</p>

        <p>Estado: <strong>${document.status}</strong></p>

        ${document.adminNote ? `<p>Nota: ${document.adminNote}</p>` : ""}

        <p>Por favor sube la corrección en: ${webBase}</p>

      `

    });

  }



  async sendAfterLicenseIssued(application: ExperienceApplicationRecord): Promise<void> {

    if (!isExperienceEmailEnabled()) return;



    const validationUrl =

      application.qrValidationUrl ??

      `${getExperienceWebBaseUrl()}/validar-licencia/${encodeURIComponent(application.folio)}`;



    await this.send({

      to: application.applicant.email,

      subject: `Licencia emitida — ${application.folio}`,

      html: `

        <p>Hola ${application.applicant.fullName},</p>

        <p>Tu licencia Las Marías Experience fue emitida.</p>

        <p><strong>Folio:</strong> ${application.folio}</p>

        <p>Validación: <a href="${validationUrl}">${validationUrl}</a></p>

      `

    });

  }



  private async send(input: SendEmailInput): Promise<void> {

    const from = process.env.EXPERIENCE_EMAIL_FROM?.trim();

    const resendKey = process.env.RESEND_API_KEY?.trim();



    if (resendKey && from) {

      const response = await fetch("https://api.resend.com/emails", {

        method: "POST",

        headers: {

          Authorization: `Bearer ${resendKey}`,

          "Content-Type": "application/json"

        },

        body: JSON.stringify({

          from,

          to: Array.isArray(input.to) ? input.to : [input.to],

          subject: input.subject,

          html: input.html

        })

      });



      if (!response.ok) {

        const body = await response.text();

        this.logger.error(`Resend error (${response.status}): ${body}`);

      } else {

        this.logger.log(`Email sent: ${input.subject}`);

      }

      return;

    }



    const smtpHost = process.env.SMTP_HOST?.trim();

    if (smtpHost) {

      this.logger.warn(

        `SMTP configured (${smtpHost}) but direct SMTP send is not implemented yet. Subject: ${input.subject}`

      );

      return;

    }



    this.logger.log(`[email stub] ${input.subject} -> ${JSON.stringify(input.to)}`);

  }

}


