import type { UserProfile } from './UserProfile';

export interface UserResponse {
  id?: string | undefined;
  name?: string | undefined;
  profile?: UserProfile | undefined;
}
