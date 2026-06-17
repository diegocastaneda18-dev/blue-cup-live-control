import { NextRequest, NextResponse } from "next/server";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  const { folio } = await context.params;
  const adminPassword = request.headers.get("x-admin-password");
  const apiBaseUrl = getNestApiBaseUrl();

  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/license`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword || ""
        },
        body: JSON.stringify(body),
        cache: "no-store"
      }
    );

    const result = await response.json().catch(() => null);
    return NextResponse.json(result, { status: response.status });
  } catch (error) {
    console.error("Next proxy POST license error", error);
    return NextResponse.json(
      { message: "No se pudo conectar con la API para generar la licencia." },
      { status: 502 }
    );
  }
}
