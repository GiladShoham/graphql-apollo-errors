import minilog from 'minilog';
const log = minilog('grpahql-apollo-error');
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
  publicDataPath: ''
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
  let {logger, publicDataPath} = actualOptions;
  return function formatError (originalError) {
    const errId = originalError.message;
    let err = errorMap.get(errId);

    if (err === undefined || !err.isBoom) {
      logger.info('Transform error to boom error');
      if (err === undefined) {
        err = new Error(originalError);
      } else {
        err = new Error(err);
      }

      logger.info('originalError message was : ', err.message);
      err = SevenBoom.wrap(err, 500);
    }

    if (err.isServer) {
      // Special implemantation for internal server errors
      logger.error(err);
    } else {
      logger.debug(err);
    }
    publicDataPath = publicDataPath ? `data.${publicDataPath}` : 'data';
    err.output.payload.data = _.get(err, publicDataPath, {});
    let finalError = err.output.payload;

    errorMap.delete(errId);
    return finalError;
  };
}
