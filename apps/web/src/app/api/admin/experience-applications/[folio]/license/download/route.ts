import { NextRequest, NextResponse } from "next/server";
import { getNestApiBaseUrl } from "@/lib/nest-api-base";

type RouteContext = {
  params: Promise<{ folio: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  const { folio } = await context.params;
  const adminPassword = request.headers.get("x-admin-password");
  const apiBaseUrl = getNestApiBaseUrl();

  try {
    const response = await fetch(
      `${apiBaseUrl}/api/experience-applications/${encodeURIComponent(folio)}/license/download`,
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
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="licencia-${folio}.pdf"`
      }
    });
  } catch (error) {
    console.error("Next proxy GET license download error", error);
    return NextResponse.json(
      { message: "No se pudo conectar con la API para descargar la licencia." },
      { status: 502 }
    );
  }
}
