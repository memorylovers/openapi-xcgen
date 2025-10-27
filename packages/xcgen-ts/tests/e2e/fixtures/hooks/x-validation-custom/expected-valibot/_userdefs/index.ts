/**
 * ユーザー定義バリデーション関数
 *
 * Valibot の v.custom() で使用するカスタムバリデーション関数
 * Valibot の Check 型に準拠（input: unknown を受け取る）
 */

/**
 * SKU形式のバリデーション
 */
export function validateSKUFormat(input: unknown): boolean {
  if (typeof input !== "string") return false;
  // カスタムバリデーションロジック（例）
  return input.length >= 3;
}

/**
 * 正の価格のバリデーション
 */
export function validatePositivePrice(input: unknown): boolean {
  if (typeof input !== "number") return false;
  // カスタムバリデーションロジック（例）
  return input > 0;
}

/**
 * ビジネスメールのバリデーション
 */
export function validateBusinessEmail(input: unknown): boolean {
  if (typeof input !== "string") return false;
  // カスタムバリデーションロジック（例）
  return !input.endsWith("@gmail.com") && !input.endsWith("@yahoo.com");
}
