import chai from 'chai';
import chaiAsPromised from "chai-as-promised";

import 'regenerator-runtime/runtime';
var rewire = require("rewire");
var index = rewire("./index.js");

import { initSevenBoom, throwError, SevenBoom, formatErrorGenerator } from './index';

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

describe('Throw error', () => {
  var errorMap;
  before(function() {
    errorMap = index.__get__("errorMap");
  });

  afterEach(function(){
    errorMap.clear();
  });

  it('Internal map is empty', (done) => {
    expect(errorMap.size).to.equal(0);
    done();
  });

  it('Throwing regular Error type', (done) => {
    let err = new Error('message');
    expect(() => {
        throwError(err)
    }).to.throw(Error);
    done();
  });

  it('Error message is uuid v4', (done) => {
    let err = new Error('message');
    expect(() => {
        throwError(err)
    }).to.throw(/^[0-9A-F]{8}-[0-9A-F]{4}-4[0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i);
    done();
  });

  it('Throwing seven boom error is still type Error', (done) => {
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myErrCode');
    expect(() => {
        throwError(error)
    }).to.throw(Error);
    done();
  });

  it('Adds error to internal map', (done) => {
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myErrCode');
    let monkeyThrowError = index.__get__("throwError");
    try {
      monkeyThrowError(error);
    } catch(err) {
      expect(errorMap.size).to.equal(1);
    }
    done();
  });

  it('Adds the full error to internal map', (done) => {
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myErrCode');
    let monkeyThrowError = index.__get__("throwError");
    try {
      monkeyThrowError(error);
    } catch(err) {
      const errId = err.message;
      let errInMap = errorMap.get(errId);
      expect(errorMap.size).to.equal(1);
      expect(error).to.equal(errInMap);
    }
    done();
  });

  it('Runs the error hook', (done) => {
    const error = SevenBoom.badRequest('my message', {'key': 'val'}, 'myErrCode');
    let hook = function(err){
      return;
    };
    let spiedHook = sinon.spy(hook);
    expect(() => {
        throwError(error, spiedHook)
    }).to.throw(Error);
    expect( spiedHook.calledWith(error) ).to.be.true;
    done();
  });
});

describe('Format error', () => {
  it('Send all data object in default', (done) => {
    const formatError = formatErrorGenerator();
    const errData = {'key': 'val'};
    const error = SevenBoom.badRequest('my message', errData, 'myErrCode');
    try {
      throwError(error);
    } catch(err) {
      const finalError = formatError(err);
      expect(finalError.data).to.equal(errData);
    }
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
    try {
      throwError(error);
    } catch(err) {
      const finalError = formatError(err);
      expect(finalError.data).to.equal(publicData);
    }
    done();
  });

  it('Hooks are called', (done) => {
    const onOriginalError = sinon.spy();
    const onStoredError = sinon.spy();
    const onProcessedError = sinon.spy();
    const onFinalError = sinon.spy();

    const hooks = {
      onOriginalError,
      onStoredError,
      onProcessedError,
      onFinalError
    }
    const fromatErrorOpts = {
      hooks
    }
    const formatError = formatErrorGenerator(fromatErrorOpts);
    const errData = {'key': 'val'};
    const storedError = SevenBoom.badRequest('my message', errData, 'myErrCode');
    const processedError = SevenBoom.wrap(storedError, 500);
    try {
      throwError(storedError);
    } catch(err) {
      const finalError = formatError(err);
      expect( onOriginalError.calledWith(err) ).to.be.true;
      expect( onStoredError.calledWith(storedError) ).to.be.true;
      expect( onProcessedError.calledWith(processedError) ).to.be.true;
      expect( onFinalError.calledWith(finalError) ).to.be.true;
    }
    done();
  });

  it('Transform regular error to SevenBoom error', (done) => {
    const formatError = formatErrorGenerator();
    const err = new Error('my message');
    try {
      throwError(err);
    } catch(err) {
      const finalError = formatError(err);
      expect( finalError.statusCode ).to.equal(500);
      expect( finalError.message ).to.equal('An internal server error occurred');
    }
    done();
  });

  it('Add the locations and path if requested', (done) => {
    const fromatErrorOpts = {
      showLocations: true,
      showPath: true
    }
    const formatError = formatErrorGenerator(fromatErrorOpts);
    const PATH = 'My path to the future'
    const LOCATIONS = 'In a great place'
    const err = new Error('my message');
    err.path = PATH;
    err.locations = LOCATIONS;

    try {
      throwError(err);
    } catch(err) {
      const finalError = formatError(err);
      expect( finalError.path ).to.equal(PATH);
      expect( finalError.locations ).to.equal(LOCATIONS);
    }
    done();
  });
});
