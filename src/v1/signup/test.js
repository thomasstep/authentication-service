const { handler } = require('./index.js');

handler({
  body: JSON.stringify({
    email: 'tstep@test.com',
    password: 'test',
  }),
}, null, (err, data) => console.log(`${err}\n${data}`));
