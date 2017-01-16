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

## How does it work
In general this library contain 3 parts:
1. SevenBoom - to create cusomize errors
2. throw method - which provide a hook place, and also store the error in the memory (because graphql will only give you the message and location)
3. foramt error function - which knows to fetch the real error by the message, add some hooks point and configuration, and pass it to the client.

## License
MIT - Do what ever you want

## Contribute
I'm open to hear any feedback - new ideas, bugs, needs.
Feel free to open issues / PR
