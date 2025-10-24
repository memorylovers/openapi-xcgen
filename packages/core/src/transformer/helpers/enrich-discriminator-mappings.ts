import { consola } from "consola";
import type { IRUnionModel, XcgenIR } from "../../types/index";

/**
 * discriminator.mappingを自動生成（Phase 2 post-processing）
 *
 * IRUnionModelでdiscriminatorがありmappingが無い場合、
 * 参照先モデルのconst値からmappingを生成する。
 *
 * @param ir - 変換対象のIR
 *
 * @example
 * ```typescript
 * // Before (Phase 1で生成されたIR)
 * {
 *   kind: "union",
 *   discriminator: { propertyName: "method" },
 *   types: [
 *     { kind: "ref", name: "#/components/schemas/CardPayment" },
 *     { kind: "ref", name: "#/components/schemas/BankTransferPayment" }
 *   ]
 * }
 *
 * // After (Phase 2でmappingを自動生成)
 * {
 *   kind: "union",
 *   discriminator: {
 *     propertyName: "method",
 *     mapping: {
 *       "card": "#/components/schemas/CardPayment",
 *       "bank_transfer": "#/components/schemas/BankTransferPayment"
 *     }
 *   },
 *   types: [...]
 * }
 * ```
 */
export function enrichDiscriminatorMappings(ir: XcgenIR): void {
  for (const model of ir.models) {
    if (
      model.kind === "union" &&
      model.discriminator &&
      !model.discriminator.mapping
    ) {
      const mapping: Record<string, string> = {};

      for (const type of model.types) {
        if (typeof type !== "string" && type.kind === "ref") {
          // Find referenced model in IR
          const refModel = ir.models.find((m) => m.referencePath === type.name);

          if (
            refModel &&
            (refModel.kind === "object" || refModel.kind === "requestBody")
          ) {
            // Find discriminator property
            const prop = refModel.properties.find(
              (p) =>
                p.name === (model as IRUnionModel).discriminator!.propertyName,
            );

            // Extract const value from validation
            if (prop?.validation?.const) {
              mapping[String(prop.validation.const)] = type.name;
            }
          }
        }
      }

      // Add mapping if any const values found
      if (Object.keys(mapping).length > 0) {
        model.discriminator.mapping = mapping;
        consola.info(
          `[enrichDiscriminatorMappings] Auto-generated mapping for ${model.name}:`,
          mapping,
        );
      }
    }
  }
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("enrichDiscriminatorMappings", () => {
    it("should auto-generate mapping from const values", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test", version: "1.0.0" },
        models: [
          {
            kind: "object",
            name: "CardPayment",
            referencePath: "#/components/schemas/CardPayment",
            properties: [
              {
                name: "method",
                type: "string",
                required: true,
                validation: { const: "card" },
              },
            ],
          },
          {
            kind: "object",
            name: "BankTransferPayment",
            referencePath: "#/components/schemas/BankTransferPayment",
            properties: [
              {
                name: "method",
                type: "string",
                required: true,
                validation: { const: "bank_transfer" },
              },
            ],
          },
          {
            kind: "union",
            name: "Payment",
            referencePath: "#/components/schemas/Payment",
            discriminator: { propertyName: "method" },
            types: [
              { kind: "ref", name: "#/components/schemas/CardPayment" },
              { kind: "ref", name: "#/components/schemas/BankTransferPayment" },
            ],
          },
        ],
        tags: [],
        endpoints: [],
      };

      enrichDiscriminatorMappings(ir);

      const unionModel = ir.models.find(
        (m) => m.kind === "union",
      ) as IRUnionModel;

      expect(unionModel.discriminator?.mapping).toEqual({
        card: "#/components/schemas/CardPayment",
        bank_transfer: "#/components/schemas/BankTransferPayment",
      });
    });

    it("should not overwrite existing mapping", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test", version: "1.0.0" },
        models: [
          {
            kind: "union",
            name: "Payment",
            referencePath: "#/components/schemas/Payment",
            discriminator: {
              propertyName: "method",
              mapping: {
                custom: "#/components/schemas/CustomPayment",
              },
            },
            types: [
              { kind: "ref", name: "#/components/schemas/CustomPayment" },
            ],
          },
        ],
        tags: [],
        endpoints: [],
      };

      enrichDiscriminatorMappings(ir);

      const unionModel = ir.models.find(
        (m) => m.kind === "union",
      ) as IRUnionModel;

      expect(unionModel.discriminator?.mapping).toEqual({
        custom: "#/components/schemas/CustomPayment",
      });
    });

    it("should skip union without discriminator", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test", version: "1.0.0" },
        models: [
          {
            kind: "union",
            name: "StringOrNumber",
            referencePath: "#/components/schemas/StringOrNumber",
            types: ["string", "int"],
          },
        ],
        tags: [],
        endpoints: [],
      };

      enrichDiscriminatorMappings(ir);

      const unionModel = ir.models.find(
        (m) => m.kind === "union",
      ) as IRUnionModel;

      expect(unionModel.discriminator).toBeUndefined();
    });

    it("should handle missing const values gracefully", () => {
      const ir: XcgenIR = {
        metadata: { title: "Test", version: "1.0.0" },
        models: [
          {
            kind: "object",
            name: "CardPayment",
            referencePath: "#/components/schemas/CardPayment",
            properties: [
              {
                name: "method",
                type: "string",
                required: true,
                // No const value
              },
            ],
          },
          {
            kind: "union",
            name: "Payment",
            referencePath: "#/components/schemas/Payment",
            discriminator: { propertyName: "method" },
            types: [{ kind: "ref", name: "#/components/schemas/CardPayment" }],
          },
        ],
        tags: [],
        endpoints: [],
      };

      enrichDiscriminatorMappings(ir);

      const unionModel = ir.models.find(
        (m) => m.kind === "union",
      ) as IRUnionModel;

      // mappingは生成されない（const値が無いため）
      expect(unionModel.discriminator?.mapping).toBeUndefined();
    });
  });
}
