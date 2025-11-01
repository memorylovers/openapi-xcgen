import { describe, expect, it } from "vitest";
import { parse, transform } from "../../../src";

describe("E2E: Transformer - Metadata Preservation", () => {
  describe("Request Body Metadata", () => {
    it("should preserve all metadata in inline requestBody (validation, extensions, readOnly, etc.)", async () => {
      const doc = await parse(
        "./tests/e2e/fixtures/metadata/validation-metadata.yaml",
      );
      const ir = transform(doc);

      // Find createUser endpoint
      const createUser = ir.endpoints.find(
        (e) => e.operationId === "createUser",
      );
      expect(createUser).toBeDefined();
      expect(createUser?.requestBody).toBeDefined();

      // Find requestBody model
      const requestBodyModels = ir.models.filter(
        (m) => m.kind === "requestBody",
      );
      expect(requestBodyModels.length).toBeGreaterThan(0);

      const createUserRequestBody = requestBodyModels.find((m) =>
        m.name.includes("PostUsers"),
      );
      expect(createUserRequestBody).toBeDefined();

      if (
        createUserRequestBody &&
        createUserRequestBody.kind === "requestBody"
      ) {
        // username: validation (minLength, maxLength, pattern) + extensions
        const usernameProp = createUserRequestBody.properties.find(
          (p) => p.name === "username",
        );
        expect(usernameProp).toEqual({
          name: "username",
          type: "string",
          required: true,
          validation: {
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          },
          extensions: {
            "x-validation-message": "Username must be 3-20 characters",
          },
        });

        // email: validation (format, maxLength) + extensions
        const emailProp = createUserRequestBody.properties.find(
          (p) => p.name === "email",
        );
        expect(emailProp).toEqual({
          name: "email",
          type: "string",
          required: true,
          validation: {
            format: "email",
            maxLength: 100,
          },
          extensions: {
            "x-unique": true,
          },
        });

        // age: defaultValue + validation (minimum, maximum)
        const ageProp = createUserRequestBody.properties.find(
          (p) => p.name === "age",
        );
        expect(ageProp).toEqual({
          name: "age",
          type: "int",
          defaultValue: 18,
          validation: {
            minimum: 0,
            maximum: 150,
          },
        });

        // bio: writeOnly + validation (maxLength)
        const bioProp = createUserRequestBody.properties.find(
          (p) => p.name === "bio",
        );
        expect(bioProp).toEqual({
          name: "bio",
          type: "string",
          writeOnly: true,
          validation: {
            maxLength: 500,
          },
        });
      }
    });
  });

  describe("Response Metadata", () => {
    it("should preserve all metadata in response model (validation, extensions, readOnly, etc.)", async () => {
      const doc = await parse(
        "./tests/e2e/fixtures/metadata/validation-metadata.yaml",
      );
      const ir = transform(doc);

      // Find UserProfile component schema model
      const userProfileModel = ir.models.find(
        (m) => m.kind === "object" && m.name === "UserProfile",
      );
      expect(userProfileModel).toBeDefined();

      if (userProfileModel && userProfileModel.kind === "object") {
        // id: readOnly + validation (format) + extensions
        const idProp = userProfileModel.properties.find((p) => p.name === "id");
        expect(idProp).toEqual({
          name: "id",
          type: "long", // int64 → long (to-ir-scalar-type.ts)
          description: "Unique user identifier",
          readOnly: true,
          validation: {
            format: "int64",
          },
          extensions: {
            "x-database-column": "user_id",
            "x-primary-key": true,
          },
        });

        // username: required + validation (minLength, maxLength, pattern) + extensions
        const usernameProp = userProfileModel.properties.find(
          (p) => p.name === "username",
        );
        expect(usernameProp).toEqual({
          name: "username",
          type: "string",
          required: true,
          description: "Username for login",
          validation: {
            minLength: 3,
            maxLength: 20,
            pattern: "^[a-zA-Z0-9_]+$",
          },
          extensions: {
            "x-validation-message":
              "Username must be 3-20 alphanumeric characters or underscore",
          },
        });

        // email: validation (format, maxLength) + extensions
        const emailProp = userProfileModel.properties.find(
          (p) => p.name === "email",
        );
        expect(emailProp).toEqual({
          name: "email",
          type: "string",
          required: true,
          description: "User email address",
          validation: {
            format: "email",
            maxLength: 100,
          },
          extensions: {
            "x-unique": true,
            "x-format": "rfc5322",
          },
        });

        // age: defaultValue + validation (minimum, maximum) + extensions
        const ageProp = userProfileModel.properties.find(
          (p) => p.name === "age",
        );
        expect(ageProp).toEqual({
          name: "age",
          type: "int",
          description: "User age",
          defaultValue: 18,
          validation: {
            minimum: 0,
            maximum: 150,
          },
          extensions: {
            "x-unit": "years",
          },
        });

        // score: validation (minimum, maximum, format) + extensions
        const scoreProp = userProfileModel.properties.find(
          (p) => p.name === "score",
        );
        expect(scoreProp).toEqual({
          name: "score",
          type: "double",
          description: "User score",
          validation: {
            format: "double",
            minimum: 0,
            maximum: 100,
          },
          extensions: {
            "x-precision": 1,
          },
        });

        // bio: writeOnly + validation (maxLength) + extensions
        const bioProp = userProfileModel.properties.find(
          (p) => p.name === "bio",
        );
        expect(bioProp).toEqual({
          name: "bio",
          type: "string",
          description: "User biography",
          writeOnly: true,
          validation: {
            maxLength: 500,
          },
          extensions: {
            "x-encrypted": true,
          },
        });

        // status: deprecated + defaultValue + extensions (enum type)
        const statusProp = userProfileModel.properties.find(
          (p) => p.name === "status",
        );
        expect(statusProp).toEqual({
          name: "status",
          type: {
            kind: "ref",
            name: "#/components/schemas/UserProfileStatus",
          },
          description: "Account status",
          deprecated: true,
          defaultValue: "active",
          extensions: {
            "x-deprecated-reason": "Use accountState instead",
          },
        });
      }
    });
  });

  describe("Parameter Metadata", () => {
    it("should preserve all metadata in parameters (validation, extensions, deprecated)", async () => {
      const doc = await parse(
        "./tests/e2e/fixtures/metadata/validation-metadata.yaml",
      );
      const ir = transform(doc);

      // Find getUserById endpoint
      const getUserById = ir.endpoints.find(
        (e) => e.operationId === "getUserById",
      );
      expect(getUserById).toBeDefined();
      expect(getUserById?.parameters).toBeDefined();

      // parameters is an IRRef, find the actual parameter model
      if (
        getUserById?.parameters &&
        typeof getUserById.parameters === "object" &&
        "kind" in getUserById.parameters &&
        getUserById.parameters.kind === "ref"
      ) {
        const paramModelName = getUserById.parameters.name;
        const paramModel = ir.models.find(
          (m) => m.kind === "parameter" && m.referencePath === paramModelName,
        );
        expect(paramModel).toBeDefined();

        if (paramModel && paramModel.kind === "parameter") {
          // Check path parameter (id) from PathItem level
          const idParam = paramModel.properties.find((p) => p.name === "id");
          expect(idParam).toEqual({
            name: "id",
            in: "path",
            type: "long", // int64 → long
            required: true,
            description: "User ID",
            validation: {
              format: "int64",
              minimum: 1,
            },
            extensions: {
              "x-route-param": true,
            },
          });

          // Check query parameter (fields)
          const fieldsParam = paramModel.properties.find(
            (p) => p.name === "fields",
          );
          expect(fieldsParam).toEqual({
            name: "fields",
            in: "query",
            type: "string",
            description: "Comma-separated list of fields to include",
            defaultValue: "id,username,email",
            validation: {
              pattern: "^[a-z,]+$",
            },
            extensions: {
              "x-example": "id,username,email,age",
            },
          });

          // Check deprecated parameter (includeDeleted)
          const includeDeletedParam = paramModel.properties.find(
            (p) => p.name === "includeDeleted",
          );
          expect(includeDeletedParam).toEqual({
            name: "includeDeleted",
            in: "query",
            type: "boolean",
            description: "Include deleted users",
            deprecated: true,
            defaultValue: false,
            extensions: {
              "x-deprecated-since": "1.5.0",
            },
          });
        }
      }
    });
  });
});
