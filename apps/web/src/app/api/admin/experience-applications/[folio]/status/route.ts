import { NextRequest, NextResponse } from "next/server";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { folio } = await context.params;
  const adminPassword = request.headers.get("x-admin-password");
  const apiBaseUrl = getNestApiBaseUrl();

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/status`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword || ""
        },
        body: JSON.stringify(body ?? {}),
        cache: "no-store"
      }
    );

    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Next proxy PATCH experience application status error", error);
    return NextResponse.json(
      {
        message: "No se pudo conectar con la API desde el proxy interno de Next.js."
      },
      { status: 502 }
    );
  }
}
