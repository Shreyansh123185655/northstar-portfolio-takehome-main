const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Password123!', 10);
console.log(hash);
