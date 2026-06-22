import { Injectable } from "@nestjs/common";
import { access, mkdir, writeFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import path from "node:path";
import type { ExperienceStorage } from "./experience-storage.interface";

const DATA_DIR = path.join(process.cwd(), "data", "experience-applications");

@Injectable()
export class FileExperienceStorageService implements ExperienceStorage {
  private absoluteFor(relativePath: string): string {
    return path.join(DATA_DIR, relativePath);
  }

  async saveBinary(relativePath: string, buffer: Buffer): Promise<void> {
    const absolutePath = this.absoluteFor(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    await writeFile(absolutePath, buffer);
  }

  async resolveAbsolutePath(relativePath: string): Promise<string> {
    const absolutePath = this.absoluteFor(relativePath);
    await access(absolutePath, fsConstants.R_OK);
    return absolutePath;
  }

  async resolveWritablePath(relativePath: string): Promise<string> {
    const absolutePath = this.absoluteFor(relativePath);
    await mkdir(path.dirname(absolutePath), { recursive: true });
    return absolutePath;
  }
}
