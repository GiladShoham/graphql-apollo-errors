import log from 'minilog';
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

export const formatError = (originalError) => {
  const errId = originalError.message;
  let err = errorMap.get(errId);

  if (err === undefined || !err.isBoom) {
    log.info('Transform error to boom error');
    if (err === undefined) {
      err = new Error(originalError);
    } else {
      err = new Error(err);
    }

    log.info('originalError message was : ', err.message);
    err = SevenBoom.wrap(err, 500);
  }

  if (err.isServer) {
    // Special implemantation for internal server errors
    log.error(err);
  } else {
    log.debug(err);
  }

  err.output.payload.data = _.get(err, 'data.public', {});
  let finalError = err.output.payload;

  errorMap.delete(errId);
  return finalError;
};
