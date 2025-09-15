/**
 * @file メタデータ Visitor
 * @description OpenAPI InfoObject から IRMetadata への変換を担当
 */

import type {
  ContactObject,
  InfoObject,
  LicenseObject,
  IRContact,
  IRLicense,
  IRMetadata,
} from "../../types";

/**
 * InfoObjectをIRMetadataに変換
 * @param info - OpenAPI InfoObject
 * @returns IRMetadata
 *
 * @example OpenAPI YAML
 * ```yaml
 * info:
 *   title: "Pet Store API"
 *   version: "1.0.0"
 *   description: "This is a sample Pet Store Server"
 *   termsOfService: "http://example.com/terms/"
 *   contact:
 *     name: "API Support"
 *     email: "support@example.com"
 *     url: "http://www.example.com/support"
 *   license:
 *     name: "Apache 2.0"
 *     url: "https://www.apache.org/licenses/LICENSE-2.0.html"
 * ```
 */
export function visitMetadata(info: InfoObject): IRMetadata {
  return {
    title: info.title,
    version: info.version,
    description: info.description || null,
    termsOfService: info.termsOfService || null,
    contact: info.contact ? visitContact(info.contact) : null,
    license: info.license ? visitLicense(info.license) : null,
  };
}

/**
 * ContactObjectをIRContactに変換
 * @param contact - OpenAPI ContactObject
 * @returns IRContact
 */
function visitContact(contact: ContactObject): IRContact {
  return {
    name: contact.name || null,
    email: contact.email || null,
    url: contact.url || null,
  };
}

/**
 * LicenseObjectをIRLicenseに変換
 * @param license - OpenAPI LicenseObject
 * @returns IRLicense
 */
function visitLicense(license: LicenseObject): IRLicense {
  return {
    name: license.name,
    url: license.url || null,
  };
}

// === in-source testing ===
if (import.meta.vitest) {
  const { describe, it, expect } = import.meta.vitest;

  describe("visitMetadata", () => {
    it("should convert minimal info to IRMetadata", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
      };

      const result = visitMetadata(info);

      expect(result).toEqual({
        title: "My API",
        version: "1.0.0",
        description: null,
        termsOfService: null,
        contact: null,
        license: null,
      });
    });

    it("should convert full info to IRMetadata", () => {
      const info: InfoObject = {
        title: "Pet Store API",
        version: "1.0.0",
        description: "This is a sample Pet Store Server",
        termsOfService: "http://example.com/terms/",
        contact: {
          name: "API Support",
          email: "support@example.com",
          url: "http://www.example.com/support",
        },
        license: {
          name: "Apache 2.0",
          url: "https://www.apache.org/licenses/LICENSE-2.0.html",
        },
      };

      const result = visitMetadata(info);

      expect(result).toEqual({
        title: "Pet Store API",
        version: "1.0.0",
        description: "This is a sample Pet Store Server",
        termsOfService: "http://example.com/terms/",
        contact: {
          name: "API Support",
          email: "support@example.com",
          url: "http://www.example.com/support",
        },
        license: {
          name: "Apache 2.0",
          url: "https://www.apache.org/licenses/LICENSE-2.0.html",
        },
      });
    });

    it("should handle partial contact info", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
        contact: {
          email: "support@example.com",
        },
      };

      const result = visitMetadata(info);

      expect(result.contact).toEqual({
        name: null,
        email: "support@example.com",
        url: null,
      });
    });

    it("should handle license without url", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
        license: {
          name: "MIT",
        },
      };

      const result = visitMetadata(info);

      expect(result.license).toEqual({
        name: "MIT",
        url: null,
      });
    });

    it("should handle undefined optional fields", () => {
      const info: InfoObject = {
        title: "My API",
        version: "1.0.0",
        description: undefined,
        termsOfService: undefined,
        contact: undefined,
        license: undefined,
      };

      const result = visitMetadata(info);

      expect(result).toEqual({
        title: "My API",
        version: "1.0.0",
        description: null,
        termsOfService: null,
        contact: null,
        license: null,
      });
    });
  });

  describe("visitContact", () => {
    it("should convert full contact to IRContact", () => {
      const contact: ContactObject = {
        name: "API Support",
        email: "support@example.com",
        url: "http://www.example.com/support",
      };

      const result = visitContact(contact);

      expect(result).toEqual({
        name: "API Support",
        email: "support@example.com",
        url: "http://www.example.com/support",
      });
    });

    it("should handle empty contact object", () => {
      const contact: ContactObject = {};

      const result = visitContact(contact);

      expect(result).toEqual({
        name: null,
        email: null,
        url: null,
      });
    });
  });

  describe("visitLicense", () => {
    it("should convert full license to IRLicense", () => {
      const license: LicenseObject = {
        name: "Apache 2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0.html",
      };

      const result = visitLicense(license);

      expect(result).toEqual({
        name: "Apache 2.0",
        url: "https://www.apache.org/licenses/LICENSE-2.0.html",
      });
    });

    it("should handle license without url", () => {
      const license: LicenseObject = {
        name: "MIT",
      };

      const result = visitLicense(license);

      expect(result).toEqual({
        name: "MIT",
        url: null,
      });
    });
  });
}
