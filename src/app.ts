import * as express from 'express';
import * as graphqllHTTP from 'express-graphql';
import schema from './graphql/schema';
import db from './models';
import { Response, NextFunction, Request } from "express";
import { extractJwtMiddleware } from './middlewares/extract-jwt.middleware';

class App {
  public express: express.Application;

  constructor() {
    this.express = express();
    this.middleware();
  }

  private middleware(): void {
    this.express.use('/graphql',

      extractJwtMiddleware(),

      (req: Request, res: Response, next: NextFunction) => {
        req['context'].db = db;
        next();
      },

      graphqllHTTP((req: Request) => ({
        schema: schema,
        graphiql: true, //process.env.NODE_ENV === 'development',
        context: req['context']
      }))
    );
  }
}


export default new App().express;
