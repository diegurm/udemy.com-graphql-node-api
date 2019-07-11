import * as express from 'express';
import * as graphqllHTTP from 'express-graphql';
import schema from './graphql/schema';
import db from './models';
import { Response, NextFunction, Request } from "express";
import { extractJwtMiddleware } from './middlewares/extract-jwt.middleware';
import { DataLoaderFactory } from "./graphql/dataloaders/DataLoaderFactory";
import { RequestedFields } from "./graphql/ast/RequestedFields";

class App {
  public express: express.Application;
  private dataLoaderFactory: DataLoaderFactory;
  private requestedFields: RequestedFields;
  
  constructor() {
    this.express = express();
    this.init();
  }
  
  private init() {
    this.requestedFields   = new RequestedFields();
    this.dataLoaderFactory = new DataLoaderFactory(db, this.requestedFields);
    this.middleware();
  }
  
  private middleware(): void {
    this.express.use('/graphql',
      
      extractJwtMiddleware(),
      
      (req: Request, res: Response, next: NextFunction) => {
        req['context']['db'] = db;
        req['context']['dataloaders'] = this.dataLoaderFactory.getLoaders();
        req['context']['requestedFields'] = this.requestedFields;
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
