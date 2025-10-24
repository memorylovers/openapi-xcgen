import pLimit from "p-limit";

/**
 * 並列処理のデフォルト並列数
 * - 小規模API（~50モデル）: 問題なし
 * - 中規模API（50-200モデル）: 最適
 * - 大規模API（200-1000モデル）: メモリ・I/O圧迫を防止
 */
const DEFAULT_CONCURRENCY = 50;

/**
 * 配列の各要素に対して非同期関数を並列実行（並列数制限あり）
 *
 * p-limitを使用して並列数を制限し、大規模処理でのリソース圧迫を防止。
 * ライブラリへの依存を一箇所に集約し、将来の差し替えを容易にする。
 *
 * @param items - 処理対象の配列
 * @param fn - 各要素に対して実行する非同期関数
 * @param concurrency - 最大並列数（デフォルト: 50）
 *
 * @example
 * await runInParallel(
 *   files,
 *   file => writer.write(file.path, file.content)
 * );
 */
export async function runInParallel<T>(
  items: T[],
  fn: (item: T) => Promise<void>,
  concurrency = DEFAULT_CONCURRENCY,
): Promise<void> {
  const limit = pLimit(concurrency);
  await Promise.all(items.map((item) => limit(() => fn(item))));
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("runInParallel", () => {
    it("should execute tasks with concurrency limit", async () => {
      const results: number[] = [];
      const items = [1, 2, 3, 4, 5];

      await runInParallel(
        items,
        async (item) => {
          results.push(item);
        },
        2, // 並列数2
      );

      expect(results).toHaveLength(5);
      expect(results.sort()).toEqual([1, 2, 3, 4, 5]);
    });

    it("should handle empty array", async () => {
      await runInParallel([], async () => {
        // Do nothing
      });
      // エラーなく完了することを確認
    });

    it("should propagate errors", async () => {
      await expect(
        runInParallel([1], async () => {
          throw new Error("Test error");
        }),
      ).rejects.toThrow("Test error");
    });
  });
}
