require('./setup');
const request = require('supertest');
const app = require('../src/app');

describe('/api/internal — secret guard', () => {
  it('returns 401 with no header', async () => {
    const res = await request(app).post('/api/internal/notifications').send({});
    expect(res.status).toBe(401);
  });

  it('returns 401 with wrong secret', async () => {
    const res = await request(app)
      .post('/api/internal/notifications')
      .set('x-internal-secret', 'wrong-secret')
      .send({});
    expect(res.status).toBe(401);
  });

  it('passes the guard with correct secret (reaches validation, not 401)', async () => {
    // Should fail Zod validation (400), NOT the secret guard (401)
    const res = await request(app)
      .post('/api/internal/notifications')
      .set('x-internal-secret', process.env.INTERNAL_SERVICE_SECRET)
      .send({});
    expect(res.status).not.toBe(401);
  });
});
