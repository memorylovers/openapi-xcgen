/**
 * Valibot validation schema for Team
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { TeamMembersSchema } from './TeamMembersSchema';

/**
 * Schema for Team
 */
export const TeamSchema = v.object({
  members: v.optional(TeamMembersSchema),
});