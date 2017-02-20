import chai from 'chai';
import chaiAsPromised from "chai-as-promised";

import 'regenerator-runtime/runtime';

import { initSevenBoom, throwError, SevenBoom } from './index';

chai.use(chaiAsPromised);
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
