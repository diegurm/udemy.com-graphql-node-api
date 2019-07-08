import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { GraphQLResolveInfo } from "graphql";
import { PostInstance } from "../../../models/PostModel";
import { Transaction } from "sequelize";
import { handleError, throwError } from "../../../utils/utils";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { AuthUser } from "../../../interfaces/AuthUserInterface";

export const postResolvers = {
  Post: {
    author: (post, args, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      let authorId = post.get('author');
      return db.User.findById(authorId).catch(handleError)
    },
    comments: (post, { first = 15, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      let postId = post.get('id');
      return db.Comment.findAll({
        where: {
          post: postId,
        },
        limit: first,
        offset: offset
      }).catch(handleError)
    }
  },
  Query: {
    posts: (parent, { first = 15, offset = 0 }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      return db.Post.findAll({
        limit: first,
        offset: offset
      }).catch(handleError)
    },
    post: (parent, { id }, { db }: { db: DbConnection }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.Post.findById(id).then((post: PostInstance) => {
        throwError(!post, `Post with id ${id} not found!`);
        return post;
      }).catch(handleError)
    }
  },
  Mutation: {
    createPost: compose(...authResolvers)((parent, { input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      input.author = authUser.id;
      
      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Post.create(input, { transaction: transaction });
      }).catch(handleError)
    }),
 
    updatePost: compose(...authResolvers)((parent, { id, input }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Post.findById(id).then((post: PostInstance) => {
          throwError(!post, `Post with id ${id} not found!`);
          throwError(post.get('author') != authUser.id, `Unauthorized! You can only edit posts by yourself!`); 
          
          input.author = authUser.id;
          return post.update(input, { transaction: transaction });
        });
      }).catch(handleError)
    }),

    deletePost: compose(...authResolvers)((parent, { id }, { db, authUser }: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      id = parseInt(id);

      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Post.findById(id).then((post: PostInstance) => {
          throwError(!post, `Post with id ${id} not found!`);
          throwError(post.get('author') != authUser.id, `Unauthorized! You can only edit posts by yourself!`); 

          return post.destroy({ transaction: transaction }).then((post) => !!post);
        });
      }).catch(handleError)
    })
  }
};
