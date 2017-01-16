# graphql-apollo-errors
A small library to handle graphql and apollo errors in a better way

## Initiative
Error handling requires few core features to be usful:
* Ability to customize error in well defined structure cross app
* Ability to hook the error bubbling (In order to log or store the errors somewhere)
* Ability to send the error to the client while sending all the relevant information yet keeping all the sensitive information only on the server

Looking around I found only 2 libraries dealing with errors in graphql and apollo - [graphql-errors](https://github.com/kadirahq/graphql-errors) , [apollo-errors](https://github.com/thebigredgeek/apollo-errors).

Both libraries are great start, but they are not powerfull enough for my opinion, therefore I decided to write my own error handler.
Talking with some friends, I understand I'm not alone with this need, so I created this library as open source.

## Usage
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
  publicDataPath: 'data.public' // Only data under this path in the data object will be sent to the client
  hooks: {
    onOriginalError: (originalError) => {logger.info(originalError.message)},
    onStoredError: (onStoredError) => {logger.info(onStoredError.message)},
    onFinalError: (onFinalError) => {logger.info(onFinalError.message)},
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

Use SevenBoom to create your custom error and throwError to throw it.
```js
import { SevenBoom, throwError } from 'graphql-apollo-errors';

const resolverThatThrowsError = (root, params, context) => {
  const errorMessage = `User with id: ${userId} not found`;
  const errorData = { userId };
  const errorName = 'USER_NOT_FOUND';
  throwError(SevenBoom.notFound(errorMessage, errorData, errorName))S;
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
