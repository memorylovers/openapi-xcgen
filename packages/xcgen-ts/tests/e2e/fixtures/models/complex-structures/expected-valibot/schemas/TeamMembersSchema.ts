/**
 * Valibot validation schema for TeamMembers
 * Auto-generated from OpenAPI specification
 */

import * as v from "valibot";
import { TeamMembersItemSchema } from './TeamMembersItemSchema';

/**
 * Schema for TeamMembers
 */
export const TeamMembersSchema = v.array(TeamMembersItemSchema);