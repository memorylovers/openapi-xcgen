/**
 * Valibot validation schema for DataTypes
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { DataTypesProfileSchema } from './DataTypesProfileSchema';
import { DataTypesTagsSchema } from './DataTypesTagsSchema';
import { DataTypesNumbersSchema } from './DataTypesNumbersSchema';
import { DataTypesScoresSchema } from './DataTypesScoresSchema';
import { DataTypesFlagsSchema } from './DataTypesFlagsSchema';

export const DataTypesSchema = v.object({
  id: v.optional(v.number()),
  name: v.optional(v.string()),
  score: v.optional(v.number()),
  isActive: v.optional(v.boolean()),
  birthDate: v.optional(v.pipe(v.string(), v.isoDate(), v.transform((val) => new Date(val)))),
  createdAt: v.optional(v.pipe(v.string(), v.isoDateTime(), v.transform((val) => new Date(val)))),
  profile: v.optional(DataTypesProfileSchema),
  tags: v.optional(DataTypesTagsSchema),
  numbers: v.optional(DataTypesNumbersSchema),
  scores: v.optional(DataTypesScoresSchema),
  flags: v.optional(DataTypesFlagsSchema),
});
