import { NextRequest, NextResponse } from "next/server";
import { buildNestAdminProxyHeaders } from "@/lib/admin-proxy-auth";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

export async function GET(request: NextRequest) {
  const apiBaseUrl = getNestApiBaseUrl();
  try {
    const response = await fetch(`${apiBaseUrl}/api/experience-applications`, {
      method: "GET",
      headers: buildNestAdminProxyHeaders(request, { json: true }),
      cache: "no-store"
    });

    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Next proxy GET experience applications error", error);
    return NextResponse.json(
      {
        message: "No se pudo conectar con la API desde el proxy interno de Next.js."
      },
      { status: 502 }
    );
  }
}
