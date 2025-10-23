import * as v from "valibot";
import { TeamMembersItemSchema } from './TeamMembersItemSchema';

/**
 * Schema for TeamMembers
 */
export const TeamMembersSchema = v.array(TeamMembersItemSchema);
