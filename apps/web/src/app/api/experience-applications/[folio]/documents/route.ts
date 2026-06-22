import { NextRequest, NextResponse } from "next/server";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { folio } = await context.params;
  console.log("[Next public proxy] uploading document", folio);

  const apiBaseUrl = getNestApiBaseUrl();

  try {
    const formData = await request.formData();
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/documents`,
      {
        method: "POST",
        body: formData
      }
    );

    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Next public proxy document upload error", error);
    return NextResponse.json(
      { message: "No se pudo conectar con la API para subir el documento." },
      { status: 502 }
    );
  }
}
