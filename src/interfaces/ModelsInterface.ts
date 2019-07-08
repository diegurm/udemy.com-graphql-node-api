import { CommentModel } from '../models/CommentModel';
import { UserModel } from '../models/UserModel';
import { PostModel } from '../models/PostModel';

export interface ModelsInterface {
  Comment: CommentModel,
  User: UserModel,
  Post: PostModel
}
