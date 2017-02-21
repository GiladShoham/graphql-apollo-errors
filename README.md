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

Both libraries are great start, but they are not powerfull enough for my opinion, therefore I decided to write my own error handler.
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
  publicDataPath: 'public', // Only data under this path in the data object will be sent to the client (path parts should be seperated by . - some.public.path)
  showLocations: true, // whether to add the graphql locations to the final error (default false)
  showPath: true, // whether to add the graphql path to the final error (default false)
  hideSensitiveData: false, // whether to remove the data object from internal server errors (default true)
  hooks: {
    // Will run on the error the formatError function got from apollo/graph - usually this error will contain only
    // message and location (this is actually the reason I build thid library)
    // In our case the message will be a guid v4 (if you throw the error via throwError) or the real message
    // if you throw it regular (this is sometime happens when the throw is not done by you but by 3rd party like mongo)
    onOriginalError: (originalError) => {logger.info(originalError.message)},
    // This run on the error we stored in the internal error map, this will be the same object as the one you run throwError on
    // In case the error didn't thrown by throwError it will be the same as the one in the originalError
    onStoredError: (storedError) => {logger.info(storedError.message)},
    // This will run on the processed error, which means after we take if from the stored and convert it to boom error if needed
    // and after we added the path and location (if requested)
    // This will run before we take only the payload and the public path of data
    onProcessedError: (processedError) => {logger.info(processedError.message)},
    // This will run on the final error, it will only contains the output.payload, and if you configured the publicDataPath
    // it will only contain this data under the data object
    // If the error is internal error this error will be a wrapped internal error which not contains the sensitive details
    // This is the error which will be sent to the client
    onFinalError: (finalError) => {logger.info(finalError.message)},
  }
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

Use SevenBoom to create your custom error and throwError to throw it.

throwError received 3 arguments:
* The error to throw
* An hook to run on the first arg (the error)
* A path to the guid - this path is used to make sure you will have the same guid in the server / log / db and in the client.
If the path exist in the error object it will used it as the guid in internal map (this will also be the message for the thrown error)
If not, it will generate guid using uuid v4 and set this guid in the provided path.
All paths are relative to the err.output.payload, and should be separated by .
The default path if not provided is just 'guid'.
(This path exist by default because the default argsDefs for seven-boom contain it)

```js
import { SevenBoom, throwError } from 'graphql-apollo-errors';

// A resolver which throws error
const getUserByIdResolver = (root, { userId }, context) => {
  UserService.getUserById(userId)
  .then((user) => {
    if (user) return user;
    const errorMessage = `User with id: ${userId} not found`;
    const errorData = { userId };
    const errorName = 'USER_NOT_FOUND';
    const err = SevenBoom.notFound(errorMessage, errorData, errorName);
    const myHook = (err) => {console.log(err.message)};
    throwError(err, myHook);
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

## How does it work
In general this library contain 3 parts:

1. [SevenBoom](https://github.com/GiladShoham/seven-boom) - A small library i wrote to create cusomize errors
2. throw method - which provide a hook place, and also store the error in the memory (because graphql will only give you the message and location)
3. foramt error function - which knows to fetch the real error by the message, add some hooks point and configuration, and pass it to the client.

## License
MIT - Do what ever you want

## Contribute
I'm open to hear any feedback - new ideas, bugs, needs.
Feel free to open issues / PR

## Support on PayPal
Hey dude! Help me out for a couple of :beers:!

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=CYFBUDM226DLS&lc=IL&item_name=graphql%2dapollo%2derrors&item_number=github%2dnpm&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donateCC_LG%2egif%3aNonHosted)
