/**
 * 共通のIR型定義
 */

/**
 * MimeType - MIMEタイプ
 * よく使われるMIMEタイプを列挙し、それ以外もstringで許可
 */
export type MimeType =
  | "application/json"
  | "application/xml"
  | "application/x-www-form-urlencoded"
  | "multipart/form-data"
  | "text/plain"
  | "text/html"
  | "application/octet-stream"
  | "image/png"
  | "image/jpeg"
  | "image/gif"
  | "application/pdf"
  | string; // その他のカスタムMIMEタイプも許可
