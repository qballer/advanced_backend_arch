import { ClientSession, MongoClient } from "mongodb";

type Fn = (...args: any[]) => any;
type AsyncFn = (...args: any[]) => Promise<any>;
export type UnwrapPromise<T> = Promise<T extends Promise<infer X> ? X : T>;
export type Transactional = <T extends Fn>(...args: Parameters<T>) => UnwrapPromise<ReturnType<T>>;
// export type TxContext = { session: ClientSession; transactional: Transactional };


export const withConnection = (connection: MongoClient) => <T extends AsyncFn>(fnFactory: (session: ClientSession) => T): T => {
  const fn = async (...args: any[]) => {
    const session = connection.startSession();
    const fn = fnFactory(session);
    session.startTransaction();
    try {
      const result = await fn(...args);
      await session.commitTransaction();
      return result;
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
    }
  };
  return fn as T;
};
