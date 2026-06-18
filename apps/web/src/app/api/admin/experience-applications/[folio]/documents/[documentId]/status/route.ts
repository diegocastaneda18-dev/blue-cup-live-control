import { NextRequest, NextResponse } from "next/server";
import { getForwardedAdminAuthHeaders } from "@/lib/admin-proxy-auth";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string; documentId: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { folio, documentId } = await context.params;
  const apiBaseUrl = getNestApiBaseUrl();

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/documents/${encodeURIComponent(documentId)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getForwardedAdminAuthHeaders(request)
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store"
      }
    );

    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Next proxy PATCH document status error", error);
    return NextResponse.json(
      { message: "No se pudo conectar con la API para actualizar el documento." },
      { status: 502 }
    );
  }
}
