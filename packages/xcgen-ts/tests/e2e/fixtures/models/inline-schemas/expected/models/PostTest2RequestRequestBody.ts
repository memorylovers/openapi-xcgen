import type { PostTest2RequestRequestBodyNested } from './PostTest2RequestRequestBodyNested';

export interface PostTest2RequestRequestBody {
  name: string;
  email: string;
  nested?: PostTest2RequestRequestBodyNested | undefined;
}
