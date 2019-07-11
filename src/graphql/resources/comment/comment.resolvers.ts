import { GraphQLResolveInfo } from "graphql";
import { DbConnection } from "../../../interfaces/DbConnectionInterface";
import { Transaction } from "sequelize";
import { CommentInstance } from "../../../models/CommentModel";
import { handleError, throwError } from "../../../utils/utils";
import { AuthUser } from "../../../interfaces/AuthUserInterface";
import { compose } from "../../composable/composable.resolver";
import { authResolvers } from "../../composable/auth.resolver";
import { DataLoaders } from "../../../interfaces/DataLoadersInterface";
import { RequestedFields } from "../../ast/RequestedFields";

export const commentResolvers = {
  Comment: {
    user: (comment, args, {db, dataloaders: {userLoader}}: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return userLoader.load({key: comment.get('user'), info}).catch(handleError);
    },
    post: (comment, args, {db, dataloaders: {postLoader}}: { db: DbConnection, dataloaders: DataLoaders }, info: GraphQLResolveInfo) => {
      return postLoader.load({key: comment.get('post'), info}).catch(handleError);
    }
  },
  Query: {
    commentsByPost: (parent, {postId, first = 10, offset = 0}, {db, requestedFields}: { db: DbConnection, requestedFields: RequestedFields }, info: GraphQLResolveInfo) => {
      postId = parseInt(postId);
      return db.Comment.findAll({
        where: {
          post: postId
        },
        limit: first,
        offset: offset,
        attributes: requestedFields.getFields(info)
      }).catch(handleError)
    }
  },
  Mutation: {
    createComment: compose(...authResolvers)((parent, {input}, {db, authUser}: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      input.author = authUser.id;
      
      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Comment.create(input, {transaction: transaction});
      }).catch(handleError)
    }),
    
    updateComment: compose(...authResolvers)((parent, {id, input}, {db, authUser}: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      id = parseInt(id);
      
      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Comment.findById(id).then((comment: CommentInstance) => {
          throwError(!comment, `Post with id ${id} not found!`);
          throwError(comment.get('user') != authUser.id, `Unauthorized! You can only edit posts by yourself!`);
          
          input.author = authUser.id;
          return comment.update(input, {transaction: transaction});
        });
      }).catch(handleError)
    }),
    
    deleteComment: compose(...authResolvers)((parent, {id}, {db, authUser}: { db: DbConnection, authUser: AuthUser }, info: GraphQLResolveInfo) => {
      return db.sequelize.transaction((transaction: Transaction) => {
        return db.Comment.findById(id).then((comment: CommentInstance) => {
          throwError(!comment, `Post with id ${id} not found!`);
          throwError(comment.get('user') != authUser.id, `Unauthorized! You can only edit posts by yourself!`);
          
          return comment.destroy({transaction: transaction}).then((comment) => !!comment);
        });
      }).catch(handleError)
    })
  }
};
