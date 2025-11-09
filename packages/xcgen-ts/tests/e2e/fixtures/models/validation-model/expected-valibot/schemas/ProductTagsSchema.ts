/**
 * Valibot validation schema for ProductTags
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";

/**
 * Schema for ProductTags
 */
export const ProductTagsSchema = v.pipe(v.array(v.string()), v.minLength(1), v.maxLength(5));