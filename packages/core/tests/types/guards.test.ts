import { describe, it, expect } from "vitest";
import {
  isReferenceObject,
  isOpenAPIV3Document,
  isOpenAPIV3_1Document,
} from "../../src/types/guards";

describe("Type Guards", () => {
  describe("isReferenceObject", () => {
    it("should identify reference object", () => {
      expect(isReferenceObject({ $ref: "#/components/schemas/User" })).toBe(
        true,
      );
      expect(isReferenceObject({ type: "string" })).toBe(false);
      expect(isReferenceObject(null)).toBe(false);
      expect(isReferenceObject(undefined)).toBe(false);
      expect(isReferenceObject("")).toBe(false);
      expect(isReferenceObject(123)).toBe(false);
      expect(isReferenceObject([])).toBe(false);
    });

    it("should handle edge cases", () => {
      expect(isReferenceObject({ $ref: "" })).toBe(true); // 空文字列でも$refがあればtrue
      expect(isReferenceObject({ $ref: null })).toBe(true); // nullでも$refキーがあればtrue
      expect(isReferenceObject({ ref: "#/components/schemas/User" })).toBe(
        false,
      ); // $なしはfalse
    });
  });

  describe("isOpenAPIV3Document", () => {
    it("should identify OpenAPI 3.0.x documents", () => {
      expect(
        isOpenAPIV3Document({
          openapi: "3.0.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(true);
      expect(
        isOpenAPIV3Document({
          openapi: "3.0.1",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(true);
      expect(
        isOpenAPIV3Document({
          openapi: "3.0.3",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(true);
    });

    it("should reject non-3.0.x documents", () => {
      expect(
        isOpenAPIV3Document({
          openapi: "3.1.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(false);
      expect(
        isOpenAPIV3Document({
          openapi: "2.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(false);
      expect(isOpenAPIV3Document({ swagger: "2.0" })).toBe(false);
      expect(isOpenAPIV3Document({})).toBe(false);
    });
  });

  describe("isOpenAPIV3_1Document", () => {
    it("should identify OpenAPI 3.1.x documents", () => {
      expect(
        isOpenAPIV3_1Document({
          openapi: "3.1.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(true);
      expect(
        isOpenAPIV3_1Document({
          openapi: "3.1.1",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(true);
    });

    it("should reject non-3.1.x documents", () => {
      expect(
        isOpenAPIV3_1Document({
          openapi: "3.0.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(false);
      expect(
        isOpenAPIV3_1Document({
          openapi: "2.0",
          info: { title: "Test", version: "1.0.0" },
          paths: {},
        }),
      ).toBe(false);
      expect(isOpenAPIV3_1Document({ swagger: "2.0" })).toBe(false);
      expect(isOpenAPIV3_1Document({})).toBe(false);
    });
  });
});
