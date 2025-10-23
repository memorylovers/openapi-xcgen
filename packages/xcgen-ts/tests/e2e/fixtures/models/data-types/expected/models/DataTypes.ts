/**
 * DataTypes model
 * Auto-generated from OpenAPI specification
 */

import type { DataTypesProfile } from './DataTypesProfile';
import type { DataTypesTags } from './DataTypesTags';
import type { DataTypesNumbers } from './DataTypesNumbers';
import type { DataTypesScores } from './DataTypesScores';
import type { DataTypesFlags } from './DataTypesFlags';

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
