require('./setup');
const request = require('supertest');
const app = require('../src/app');

describe('Authentication guards', () => {
  it('returns 401 on protected routes without token', async () => {
    const res = await request(app).get('/api/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 with invalid JWT', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', 'Bearer totally.invalid.token');
    expect(res.status).toBe(403);
  });

  it('returns 401 on mangaka routes without token', async () => {
    const res = await request(app).get('/api/mangaka/series');
    expect(res.status).toBe(401);
  });

  it('returns 401 on admin routes without token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });
});

describe('Register — role restriction', () => {
  it('rejects admin role self-registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'hacker', email: 'hacker@test.com', password: 'pass123', role: 'admin' });
    expect(res.status).toBe(400);
  });

  it('rejects editor role self-registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'hacker', email: 'hacker@test.com', password: 'pass123', role: 'editor' });
    expect(res.status).toBe(400);
  });

  it('rejects board role self-registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ username: 'hacker', email: 'hacker@test.com', password: 'pass123', role: 'board' });
    expect(res.status).toBe(400);
  });
});
