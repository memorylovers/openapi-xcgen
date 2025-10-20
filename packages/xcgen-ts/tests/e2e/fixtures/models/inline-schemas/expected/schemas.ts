/**
 * Valibot validation schemas
 * Generated from: Inline Schemas Test API 1.0.0
 * DO NOT EDIT - This file is auto-generated
 */

import * as v from "valibot";

/**
 * Schema for RoleEnum
 */
export const RoleEnumSchema = v.picklist(["admin", "user"]);

/**
 * Schema for StatusEnum
 */
export const StatusEnumSchema = v.picklist(["active", "inactive"]);

/**
 * Schema for UserProfile
 */
export const UserProfileSchema = v.object({
  bio: v.optional(v.string()),
  active: v.optional(v.boolean()),
});

/**
 * Schema for UserResponse
 */
export const UserResponseSchema = v.object({
  id: v.optional(v.string()),
  name: v.optional(v.string()),
  profile: v.optional(UserProfileSchema),
});

/**
 * Schema for GetTest1ParametersId200Response
 */
export const GetTest1ParametersId200ResponseSchema = v.object({
  result: v.optional(v.string()),
});

/**
 * Schema for PostTest2RequestRequestBodyNested
 */
export const PostTest2RequestRequestBodyNestedSchema = v.object({
  value: v.optional(v.string()),
  count: v.optional(v.number()),
  role: v.optional(RoleEnumSchema),
});

/**
 * Schema for PostTest2RequestRequestBody
 */
export const PostTest2RequestRequestBodySchema = v.object({
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  nested: v.optional(PostTest2RequestRequestBodyNestedSchema),
});

/**
 * Schema for PostTest2Request201Response
 */
export const PostTest2Request201ResponseSchema = v.object({
  result: v.optional(v.string()),
});

/**
 * Schema for GetTest3Response201ResponseItem
 */
export const GetTest3Response201ResponseItemSchema = v.object({
  name: v.optional(v.string()),
  testStatus: v.optional(StatusEnumSchema),
  isActive: v.optional(v.boolean()),
});

/**
 * Schema for GetTest3Response201Response
 */
export const GetTest3Response201ResponseSchema = v.array(GetTest3Response201ResponseItemSchema);

/**
 * Schema for GetTest3Response202ResponseResultStatus
 */
export const GetTest3Response202ResponseResultStatusSchema = v.picklist(["success", "failed"]);

/**
 * Schema for GetTest3Response202ResponseResult
 */
export const GetTest3Response202ResponseResultSchema = v.object({
  status: v.optional(GetTest3Response202ResponseResultStatusSchema),
});

/**
 * Schema for GetTest3Response202Response
 */
export const GetTest3Response202ResponseSchema = v.object({
  count: v.optional(v.number()),
  result: v.optional(GetTest3Response202ResponseResultSchema),
});
