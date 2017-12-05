# graphql-apollo-errors
A small library to handle graphql and apollo errors in a better way

This library is fully tested with 100% coverage

[![CircleCI](https://circleci.com/gh/GiladShoham/graphql-apollo-errors/tree/master.svg?style=svg)](https://circleci.com/gh/GiladShoham/graphql-apollo-errors/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/GiladShoham/graphql-apollo-errors/badge.svg?branch=master)](https://coveralls.io/github/GiladShoham/graphql-apollo-errors?branch=master)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CYFBUDM226DLS&lc=IL&item_name=graphql%2dapollo%2derrors&item_number=github%2dnpm&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)

## Initiative
Error handling requires few core features to be useful:
* Ability to customize error in well defined structure cross app
* Ability to hook the error bubbling (In order to log or store the errors somewhere)
* Ability to send the error to the client while sending all the relevant information yet keeping all the sensitive information only on the server

Looking around I found only 2 libraries dealing with errors in graphql and apollo - [graphql-errors](https://github.com/kadirahq/graphql-errors) , [apollo-errors](https://github.com/thebigredgeek/apollo-errors).

Both libraries are great start, but they are not powerful enough for my opinion, therefore I decided to write my own error handler.
Talking with some friends, I understand I'm not alone with this need, so I created this library as open source.

## Usage

(Look in the spec files to understand more)

Configure apollo error formatting

```js
import express from 'express';
import bodyParser from 'body-parser';
import { formatErrorGenerator } from 'graphql-apollo-errors';
import schema from './schema';
// You can use what ever you want, this is just an example
var logger = require('minilog')('errors-logger');

const formatErrorOptions = {
  logger,
  publicDataPath: 'public', // Only data under this path in the data object will be sent to the client (path parts should be separated by . - some.public.path)
  showLocations: true, // whether to add the graphql locations to the final error (default false)
  showPath: true, // whether to add the graphql path to the final error (default false)
  hideSensitiveData: false, // whether to remove the data object from internal server errors (default true)
  hooks: {
    // This run on the error you really throw from your code (not the graphql error - it means not with path and locations)
    onOriginalError: (originalError) => {logger.info(originalError.message)},
    // This will run on the processed error, which means after we convert it to boom error if needed
    // and after we added the path and location (if requested)
    // If the error is not a boom error, this error won't include the original message but general internal server error message
    // This will run before we take only the payload and the public path of data
    onProcessedError: (processedError) => {logger.info(processedError.message)},
    // This will run on the final error, it will only contains the output.payload, and if you configured the publicDataPath
    // it will only contain this data under the data object
    // If the error is internal error this error will be a wrapped internal error which not contains the sensitive details
    // This is the error which will be sent to the client
    onFinalError: (finalError) => {logger.info(finalError.message)},
  },
  nonBoomTransformer: (nonBoomError) => {error instanceof GraphQLError ? SevenBoom.badRequest(error.message) : SevenBoom.badImplementation(error)}
  // Optional function to transform non-Boom errors, such as those from Apollo & other 3rd-party libraries, into Boom errors
};
const formatError = formatErrorGenerator(formatErrorOptions);
const app = express();

app.use('/graphql',
  bodyParser.json(),
  graphqlExpress({
    formatError,
    schema
  })
);

app.listen(8080)
```

Init SevenBoom object
The defalut args for SevenBoom are
```js
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
```
If you want you can change it using the initSevenBoom function:
```js
import { initSevenBoom } from 'graphql-apollo-errors';
const customArgsDefs = [
  {
    name : 'errorCode',
    order: 1
  }
];
initSevenBoom(customArgsDefs);
```

Use SevenBoom to create your custom error and throw it.

```js
import { SevenBoom } from 'graphql-apollo-errors';

// A resolver which throws error
const getUserByIdResolver = (root, { userId }, context) => {
  UserService.getUserById(userId)
  .then((user) => {
    if (user) return user;
    const errorMessage = `User with id: ${userId} not found`;
    const errorData = { userId };
    const errorName = 'USER_NOT_FOUND';
    const err = SevenBoom.notFound(errorMessage, errorData, errorName);
    throw(err);
  }
}
```

Enjoy your shiny error on the client
```js
{
  "data": {},
  "errors": [
    {
      statusCode: '404',
      error: 'Not Found',
      message: 'User with id: 123 not found.',
      code: 'USER_NOT_FOUND',
      timeThrown: "2017-01-16T21:25:58.536Z",
      guid: 'b6c44655-0aae-486a-8d28-533db6c6c343',
      data: {
        userId: '123'
      }
    }
  ]
}
```
## Upgrade from v1.*.*
There is a lot of changes from v1. (In the implementation, which leads to API changes)
* onStoredError hook is no longer exist (actually the onOriginalError result is the same as the onStoredError before)
* You should not use the throwError any more (it was deleted), you can use the native throw now.

## How does it work
In general this library contain 2 parts:

1. [SevenBoom](https://github.com/GiladShoham/seven-boom) - A small library i wrote to create customize errors
2. format error function - which knows to fetch the real error, hide sensitive server data, add some hooks points and configuration, and pass it to the client.

## License
MIT - Do what ever you want

## Contribute
I'm open to hear any feedback - new ideas, bugs, needs.
Feel free to open issues / PR

## Support on PayPal
Hey dude! Help me out for a couple of :beers:!

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CYFBUDM226DLS&lc=IL&item_name=graphql%2dapollo%2derrors&item_number=github%2dnpm&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)
