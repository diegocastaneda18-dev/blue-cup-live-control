import type { NextRequest } from "next/server";

export type NestAdminProxyHeaderOptions = {
  json?: boolean;
};

/** Forward admin auth headers from browser → Nest API via Next proxy. */
export function buildNestAdminProxyHeaders(
  request: NextRequest,
  options: NestAdminProxyHeaderOptions = {}
): HeadersInit {
  const authorization = request.headers.get("authorization");
  const adminPassword = request.headers.get("x-admin-password");

  const headers: Record<string, string> = {
    ...(authorization ? { Authorization: authorization } : {}),
    ...(adminPassword ? { "x-admin-password": adminPassword } : {})
  };

  if (options.json) {
    headers["Content-Type"] = "application/json";
  }

  return headers;
}

/** @deprecated Use buildNestAdminProxyHeaders */
export function getForwardedAdminAuthHeaders(request: NextRequest): HeadersInit {
  return buildNestAdminProxyHeaders(request);
}
