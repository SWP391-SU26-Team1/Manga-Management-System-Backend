require('./setup');
const request = require('supertest');
const app = require('../src/app');
const { makeToken, USER_A_ID, USER_B_ID, ADMIN_ID } = require('./helpers/jwt');

const userAToken = makeToken({ id: USER_A_ID, role: 'mangaka' });
const userBToken = makeToken({ id: USER_B_ID, role: 'mangaka' });
const adminToken = makeToken({ id: ADMIN_ID, role: 'admin' });

describe('User resource ownership', () => {
  it('user cannot read another user profile', async () => {
    const res = await request(app)
      .get(`/api/users/${USER_B_ID}`)
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(403);
  });

  it('user can read own profile (auth passes, may 404 without DB)', async () => {
    const res = await request(app)
      .get(`/api/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${userAToken}`);
    // 401/403 means auth blocked it — that's wrong
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('admin can read any user profile', async () => {
    const res = await request(app)
      .get(`/api/users/${USER_B_ID}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).not.toBe(403);
  });

  it('user cannot update another user', async () => {
    const res = await request(app)
      .patch(`/api/users/${USER_B_ID}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ name: 'Hacked' });
    expect(res.status).toBe(403);
  });

  it('non-admin cannot escalate their own role', async () => {
    const res = await request(app)
      .patch(`/api/users/${USER_A_ID}`)
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ role: 'admin' });
    expect(res.status).toBe(403);
  });
});

describe('Role-based access control', () => {
  it('non-admin cannot access admin-only user list', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(403);
  });

  it('non-admin cannot delete files (upload delete is admin-only)', async () => {
    const res = await request(app)
      .delete('/api/uploads/some-public-id')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(403);
  });

  it('mangaka cannot access editor-only routes', async () => {
    const res = await request(app)
      .get('/api/editor/series')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(403);
  });

  it('mangaka cannot access board routes', async () => {
    const res = await request(app)
      .get('/api/board/sessions')
      .set('Authorization', `Bearer ${userAToken}`);
    expect(res.status).toBe(403);
  });
});
