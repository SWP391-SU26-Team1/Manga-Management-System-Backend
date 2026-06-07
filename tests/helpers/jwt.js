const jwt = require('jsonwebtoken');

const SECRET = process.env.JWT_SECRET || 'test-secret-do-not-use-in-prod';

// Use real v4 UUIDs so Zod uuid() validation passes
const USER_A_ID = '11111111-1111-4111-a111-111111111111';
const USER_B_ID = '22222222-2222-4222-a222-222222222222';
const ADMIN_ID  = 'aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa';

const makeToken = (overrides = {}) =>
  jwt.sign(
    { id: USER_A_ID, role: 'mangaka', username: 'testuser', ...overrides },
    SECRET,
    { expiresIn: '1h' }
  );

module.exports = { makeToken, USER_A_ID, USER_B_ID, ADMIN_ID };
