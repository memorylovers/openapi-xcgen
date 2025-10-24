import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

/**
 * ファイル書き込み抽象化インターフェース
 */
export interface IFileWriter {
  /**
   * ファイルを書き込む（ディレクトリは自動作成）
   *
   * @param path - 相対パス（例: "models/Pet.ts"）
   * @param content - ファイルの内容
   */
  write(path: string, content: string): Promise<void>;

  /**
   * ディレクトリを作成する
   *
   * @param dir - 相対ディレクトリパス
   */
  mkdir(dir: string): Promise<void>;
}

/**
 * 実ファイルシステムへの書き込み
 */
export class FileWriter implements IFileWriter {
  constructor(private baseDir: string) {}

  async write(path: string, content: string): Promise<void> {
    const fullPath = join(this.baseDir, path);
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content, "utf-8");
  }

  async mkdir(dir: string): Promise<void> {
    const fullPath = join(this.baseDir, dir);
    await mkdir(fullPath, { recursive: true });
  }
}

/**
 * テスト用のメモリ内書き込み
 */
export class MockFileWriter implements IFileWriter {
  readonly files = new Map<string, string>();
  readonly directories: string[] = [];

  async write(path: string, content: string): Promise<void> {
    this.files.set(path, content);
  }

  async mkdir(dir: string): Promise<void> {
    this.directories.push(dir);
  }

  getFile(path: string): string | undefined {
    return this.files.get(path);
  }

  clear(): void {
    this.files.clear();
    this.directories.length = 0;
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("MockFileWriter", () => {
    it("should store files in memory", async () => {
      const writer = new MockFileWriter();

      await writer.write("test.ts", "content");

      expect(writer.getFile("test.ts")).toBe("content");
      expect(writer.files.size).toBe(1);
    });

    it("should track directory creation", async () => {
      const writer = new MockFileWriter();

      await writer.mkdir("models");
      await writer.mkdir("schemas");

      expect(writer.directories).toEqual(["models", "schemas"]);
    });

    it("should clear all data", async () => {
      const writer = new MockFileWriter();

      await writer.write("test.ts", "content");
      await writer.mkdir("models");

      writer.clear();

      expect(writer.files.size).toBe(0);
      expect(writer.directories).toHaveLength(0);
    });
  });
}
