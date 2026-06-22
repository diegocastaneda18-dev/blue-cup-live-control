import path from "node:path";

/** Logical path for local disk and DB storage_path (uploads/...). */
export function buildDocumentRelativePath(
  folio: string,
  documentId: string,
  safeOriginalName: string
): string {
  const fileName = `${documentId}-${safeOriginalName}`;
  return path.posix.join("uploads", folio, fileName);
}

/** Logical path for license PDF (licenses/...). */
export function buildLicenseRelativePath(folio: string): string {
  return path.posix.join("licenses", folio, "license.pdf");
}

/** Object key inside bucket experience-documents: [folio]/[documentId]-[safeFileName] */
export function supabaseDocumentObjectPath(
  folio: string,
  documentId: string,
  safeOriginalName: string
): string {
  return `${folio}/${documentId}-${safeOriginalName}`;
}

/** Object key inside bucket experience-licenses: [folio]/license.pdf */
export function supabaseLicenseObjectPath(folio: string): string {
  return `${folio}/license.pdf`;
}
