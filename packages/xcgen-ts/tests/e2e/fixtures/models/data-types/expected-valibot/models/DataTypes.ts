/**
 * DataTypes model
 * Auto-generated from OpenAPI specification
 */

import type { DataTypesFlags } from './DataTypesFlags';
import type { DataTypesNumbers } from './DataTypesNumbers';
import type { DataTypesProfile } from './DataTypesProfile';
import type { DataTypesScores } from './DataTypesScores';
import type { DataTypesTags } from './DataTypesTags';

export interface DataTypes {
  id?: number | undefined;
  name?: string | undefined;
  score?: number | undefined;
  isActive?: boolean | undefined;
  birthDate?: Date | undefined;
  createdAt?: Date | undefined;
  profile?: DataTypesProfile | undefined;
  tags?: DataTypesTags | undefined;
  numbers?: DataTypesNumbers | undefined;
  scores?: DataTypesScores | undefined;
  flags?: DataTypesFlags | undefined;
}