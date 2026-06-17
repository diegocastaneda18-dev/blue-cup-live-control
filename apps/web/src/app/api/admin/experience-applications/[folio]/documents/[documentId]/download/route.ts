import { NextRequest, NextResponse } from "next/server";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string; documentId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { folio, documentId } = await context.params;
  const adminPassword = request.headers.get("x-admin-password");
  const apiBaseUrl = getNestApiBaseUrl();

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/documents/${encodeURIComponent(documentId)}/download`,
      {
        method: "GET",
        headers: {
          "x-admin-password": adminPassword || ""
        },
        cache: "no-store"
      }
    );

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      return NextResponse.json(result, { status: response.status });
    }

    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "application/octet-stream";
    const disposition = response.headers.get("content-disposition");

    return new NextResponse(buffer, {
      status: response.status,
      headers: {
        "Content-Type": contentType,
        ...(disposition ? { "Content-Disposition": disposition } : {})
      }
    });
  } catch (error) {
    console.error("Next proxy GET document download error", error);
    return NextResponse.json(
      { message: "No se pudo conectar con la API para descargar el documento." },
      { status: 502 }
    );
  }
}
