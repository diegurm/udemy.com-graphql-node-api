import { ComposableResolver } from "./composable.resolver";
import { ResolverContext } from "../../interfaces/ResolverContextInterface";
import { GraphQLFieldResolver, GraphQLResolveInfo } from "graphql";
import * as jwt from 'jsonwebtoken';
import { JWT_SECRET } from "../../utils/utils";

export const verifyTokenResolver: ComposableResolver<any, ResolverContext> =
  (resolver: GraphQLFieldResolver<any, ResolverContext>): GraphQLFieldResolver<any, ResolverContext> => {
    return (parent, args, context: ResolverContext, info: GraphQLResolveInfo) => {

      const token: string = context.authorization ? context.authorization.split(' ')[1] : undefined;
      return jwt.verify(token, JWT_SECRET, (err, decoded: any) => {

        if (!err) {
          return resolver(parent, args, context, info);
        }

        throw new Error(`${err.name}:${err.message}`);
      });
    }
  }