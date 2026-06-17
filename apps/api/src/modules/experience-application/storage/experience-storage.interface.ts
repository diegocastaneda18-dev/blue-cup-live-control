export const EXPERIENCE_STORAGE = Symbol("EXPERIENCE_STORAGE");

export interface ExperienceStorage {
  /** Writes binary content for a logical relative path (uploads/... or licenses/...). */
  saveBinary(relativePath: string, buffer: Buffer, contentType?: string): Promise<void>;

  /** Returns an absolute filesystem path suitable for streaming (downloads from Supabase to temp if needed). */
  resolveAbsolutePath(relativePath: string): Promise<string>;

  /** Returns a writable absolute path (local dir or temp file before upload). */
  resolveWritablePath(relativePath: string): Promise<string>;
}
