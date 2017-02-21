var log = require('minilog')('grpahql-apollo-error');
require('minilog').enable();
import _ from 'lodash';
import uuid from 'uuid';
import SevenBoom from 'seven-boom';


const errorMap = new Map();
const defaultArgsDef = [
  {
    name : 'errorCode',
    order: 1
  }, {
    name : 'timeThrown',
    order: 2,
    default: null
  }, {
    name : 'guid',
    order: 3,
    default: null
  }
];
SevenBoom.init(defaultArgsDef);

const defaultFormatErrorOptions = {
  logger: log,
  publicDataPath: '',
  hooks: {}
}

export { SevenBoom };

export const initSevenBoom = (argsDef) => {
  SevenBoom.init(argsDef);
};

export const throwError = (err, errHook) => {
  if (errHook && _.isFunction(errHook)) {
    errHook(err);
  }

  const errId = uuid.v4();
  errorMap.set(errId, err);
  err.message = errId;
  throw err;
};

export const formatErrorGenerator = (formatErrorOptions) => {
  const actualOptions = _.defaults(formatErrorOptions, defaultFormatErrorOptions);
  let {logger, publicDataPath, hooks, showLocations, showPath} = actualOptions;
  const {onOriginalError, onStoredError, onProcessedError, onFinalError} = hooks;

  return function formatError (originalError) {
    if (onOriginalError && _.isFunction(onOriginalError)){
      onOriginalError(originalError)
    }
    const errId = originalError.message;
    let err = errorMap.get(errId);

    if (onStoredError && _.isFunction(onStoredError)){
      onStoredError(err)
    }


    if (err === undefined || !err.isBoom) {
      logger.log('Transform error to boom error');
      if (err === undefined) {
        err = new Error(originalError);
      } else {
        err = new Error(err);
      }

      logger.log('originalError message was : ', err.message);
      err = SevenBoom.wrap(err, 500);
    }

    if (showLocations){
      err.output.payload.locations = originalError.locations;
    }

    if (showPath){
      err.output.payload.path = originalError.path;
    }

    // Special implemantation for internal server errors
    if (err.isServer) {
      // logger.error(err);
    } else {
      // logger.debug(err);
    }

    if (onProcessedError && _.isFunction(onProcessedError)){
      onProcessedError(err)
    }

    publicDataPath = publicDataPath ? `data.${publicDataPath}` : 'data';
    err.output.payload.data = _.get(err, publicDataPath, {});
    let finalError = err.output.payload;

    if (onFinalError && _.isFunction(onFinalError)){
      onFinalError(finalError)
    }

    errorMap.delete(errId);
    return finalError;
  };
}
