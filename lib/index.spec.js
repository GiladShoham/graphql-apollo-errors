import chai from 'chai';
import chaiAsPromised from "chai-as-promised";

import 'regenerator-runtime/runtime';
// var rewire = require("rewire");
// var index = rewire("./index.js");

import { initSevenBoom, SevenBoom, formatErrorGenerator } from './index';

chai.use(chaiAsPromised);
chai.use(require('sinon-chai'));
import sinon from 'sinon';

const expect = chai.expect;

// Most of this tests are taken from the Boom repo
// In order to make sure that you can just replace all Boom with SevenBoom
describe('Init seven boom', () => {
  it('uses the default seven boom argsDefs - guid generator and timeThrown with errorCode arg', (done) => {
    const opts = [
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

    initSevenBoom(opts);
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myErrCode');
    expect(error.output.payload.guid).to.be.a('string');
    // expect(error.output.payload.timeThrown).to.be.a.dateString();
    expect(error.message).to.equal('my message');
    expect(error.output.statusCode).to.equal(400);
    expect(error.output.payload).to.include({
          statusCode: 400,
          error: 'Bad Request',
          message: 'my message',
          errorCode: 'myErrCode'
        });
    expect(error.data).to.include({'key': 'val'});
    done();
  });

  it('I can override the default seven-boom args', (done) => {
    const opts = [
      {
        name : 'myCustomField',
        order: 1
      }
    ];

    initSevenBoom(opts);
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myCustomFieldValue');
    expect(error.message).to.equal('my message');
    expect(error.output.statusCode).to.equal(400);
    expect(error.output.payload).to.include({
          statusCode: 400,
          error: 'Bad Request',
          message: 'my message',
          myCustomField: 'myCustomFieldValue'
        });
    expect(error.data).to.include({'key': 'val'});
    done();
  });
});

describe('Format error', () => {
  it('Send all data object in default', (done) => {
    const formatError = formatErrorGenerator();
    const errData = {'key': 'val'};
    const error = SevenBoom.badRequest('my message', errData, 'myErrCode');
    const err = _simulateGraphqlWrapping(error);
    const finalError = formatError(err);
    expect(finalError.data).to.equal(errData);
    done();
  });

  it('Send only publicPath data', (done) => {
    const fromatErrorOpts = {
      publicDataPath: 'public'
    }
    const formatError = formatErrorGenerator(fromatErrorOpts);
    const publicData = {'myPublic': 'data'};
    const errData = {'key': 'val', public:publicData};
    const error = SevenBoom.badRequest('my message', errData, 'myErrCode');
    const err = _simulateGraphqlWrapping(error);
    const finalError = formatError(err);
    expect(finalError.data).to.equal(publicData);
    done();
  });

  it('Hooks are called', (done) => {
    const onOriginalError = sinon.spy();
    const onProcessedError = sinon.spy();
    const onFinalError = sinon.spy();

    const hooks = {
      onOriginalError,
      onProcessedError,
      onFinalError
    }
    const fromatErrorOpts = {
      hooks
    }
    const formatError = formatErrorGenerator(fromatErrorOpts);
    // const errData = {'key': 'val'};
    // const originalError = new Error('my message', errData, 'myErrCode');
    const originalError = new Error('my message');
    const processedError = SevenBoom.wrap(originalError, 500);
    const err = _simulateGraphqlWrapping(originalError);
    const finalError = formatError(err);
    expect( onOriginalError.calledWith(originalError) ).to.be.true;
    expect( onProcessedError.calledWith(processedError) ).to.be.true;
    expect( onFinalError.calledWith(finalError) ).to.be.true;
    done();
  });

  it('Transform regular error to SevenBoom error', (done) => {
    const formatError = formatErrorGenerator();
    const error = new Error('my message');
    const err = _simulateGraphqlWrapping(error);
    const finalError = formatError(err);
    expect( finalError.statusCode ).to.equal(500);
    expect( finalError.message ).to.equal('An internal server error occurred');
    done();
  });

  it('Add the locations and path if requested', (done) => {
    const fromatErrorOpts = {
      showLocations: true,
      showPath: true
    }
    const formatError = formatErrorGenerator(fromatErrorOpts);
    const PATH = 'My path to the future';
    const LOCATIONS = 'In a great place';
    const error = new Error('my message');
    const err = _simulateGraphqlWrapping(error, LOCATIONS, PATH);

    const finalError = formatError(err);
    expect( finalError.path ).to.equal(PATH);
    expect( finalError.locations ).to.equal(LOCATIONS);
    done();
  });

  it('Default hide sensitive data from internal error', (done) => {
    const argsDef = [
      {
        name : 'errorCode',
        order: 1
      },{
        name : 'timeThrown',
        order: 3,
        default: null
      }, {
        name : 'guid',
        order: 4,
        default: null
      }
    ];
    initSevenBoom(argsDef);
    const formatError = formatErrorGenerator();
    const sensitiveData = {'secret': 'SevenBoom'};
    const internalError = SevenBoom.internal('Technial message which client should not see', sensitiveData, 'myErrCode');
    const err = _simulateGraphqlWrapping(internalError);

    const finalError = formatError(err);
    expect( finalError.data ).to.be.empty;
    expect( finalError.statusCode ).to.equal(500);
    expect( finalError.message ).to.equal('An internal server error occurred');

    done();
  });

  it('Do not hide sensitive data from internal error when specifically asked', (done) => {
    const argsDef = [
      {
        name : 'errorCode',
        order: 1
      },{
        name : 'timeThrown',
        order: 3,
        default: null
      }, {
        name : 'guid',
        order: 4,
        default: null
      }
    ];
    initSevenBoom(argsDef);
    const formatError = formatErrorGenerator({hideSensitiveData: false});
    const sensitiveData = {'secret': 'SevenBoom'};
    const internalError = SevenBoom.internal('Technial message which client should not see', sensitiveData, 'myErrCode');
    const err = _simulateGraphqlWrapping(internalError);
    const finalError = formatError(err);
    expect( finalError.data ).to.include(sensitiveData);
    expect( finalError.statusCode ).to.equal(500);
    expect( finalError.message ).to.equal('An internal server error occurred');
    done();
  });
});

// Code taken from grpahql implemantation here (with some changes):
// https://github.com/graphql/graphql-js/blob/44f315d1ff72ab32b794937fd11a7f8e792fd873/src/error/GraphQLError.js#L66-L69
function _simulateGraphqlWrapping(originalError, locations, path, nodes, source, positions){
  var resultError = new Error();
  Object.defineProperties(resultError, {
    message: {
      value: originalError.message,
      // By being enumerable, JSON.stringify will include `message` in the
      // resulting output. This ensures that the simplist possible GraphQL
      // service adheres to the spec.
      enumerable: true,
      writable: true
    },
    locations: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: locations || [
        {
          "line": 5,
          "column": 12,
          "field": "email" // HERE
        }
      ],
      // By being enumerable, JSON.stringify will include `locations` in the
      // resulting output. This ensures that the simplist possible GraphQL
      // service adheres to the spec.
      enumerable: true
    },
    path: {
      // Coercing falsey values to undefined ensures they will not be included
      // in JSON.stringify() when not provided.
      value: path || "Some path",
      // By being enumerable, JSON.stringify will include `path` in the
      // resulting output. This ensures that the simplist possible GraphQL
      // service adheres to the spec.
      enumerable: true
    },
    nodes: {
      value: nodes || 'Nodes'
    },
    source: {
      value: source || 'Source',
    },
    positions: {
      value: positions || 'Positions',
    },
    originalError: {
      value: originalError
    }
  });

  return resultError;
}
