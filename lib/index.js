const log = require('minilog')('graphql-apollo-error');
require('minilog').enable();
import _ from 'lodash';
import SevenBoom from 'seven-boom';

const defaultArgsDef = [
  {
    name: 'errorCode',
    order: 1
  }, {
    name: 'timeThrown',
    order: 2,
    default: null
  }, {
    name: 'guid',
    order: 3,
    default: null
  }
];
SevenBoom.init(defaultArgsDef);

const defaultFormatErrorOptions = {
  logger: log,
  publicDataPath: '',
  hideSensitiveData: true,
  hooks: {}
};

export {SevenBoom};

export const initSevenBoom = (argsDef) => {
  SevenBoom.init(argsDef);
};

export const formatErrorGenerator = (formatErrorOptions) => {
  const actualOptions = _.defaults(formatErrorOptions, defaultFormatErrorOptions);
  let {logger, publicDataPath, hooks, showLocations, showPath, hideSensitiveData, nonBoomTransformer} = actualOptions;
  const {onOriginalError, onProcessedError, onFinalError} = hooks;
  publicDataPath = publicDataPath ? `data.${publicDataPath}` : 'data';

  return function formatError(graphqlError) {

    let err = graphqlError.originalError || graphqlError;

    if (onOriginalError && _.isFunction(onOriginalError)) {
      onOriginalError(err)
    }

    if (err === undefined || !err.isBoom) {
      if (nonBoomTransformer && _.isFunction(nonBoomTransformer)) {
        err = nonBoomTransformer(err)
      } else {
        logger[logger.info ? 'info' : 'log'](`Transform error to boom error: ${err}`);
        err = SevenBoom.wrap(err, 500);
      }
    }

    if (showLocations) {
      err.output.payload.locations = graphqlError.locations;
    }

    if (showPath) {
      err.output.payload.path = graphqlError.path;
    }

    if (onProcessedError && _.isFunction(onProcessedError)) {
      onProcessedError(err)
    }

    err.output.payload.data = _.get(err, publicDataPath, {});
    let finalError = err.output.payload;

    // Special implementation for internal server errors
    if (err.isServer && hideSensitiveData) {
      // logger.error(err);
      delete finalError.data;
    } else {
      // logger.debug(err);
    }

    if (onFinalError && _.isFunction(onFinalError)) {
      onFinalError(finalError)
    }

    return finalError;
  };
};
