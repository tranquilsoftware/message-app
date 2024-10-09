const request = require('supertest');
const app = require('../backend/server'); // Adjust this path to your Express app file
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

let authToken;
let userId;
let groupId;
let chatRoomId;
let messageId;

beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(process.env.MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
});

afterAll(async () => {
  // Disconnect from the test database
  await mongoose.connection.close();
});

describe('Authentication Routes', () => {
  test('POST /api/register', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        username: 'testuser',
        password: 'testpassword',
        email: 'test@example.com'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('userId');
    userId = res.body.userId;
  });

  test('POST /api/login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({
        username: 'testuser',
        password: 'testpassword'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('expiresIn');
    expect(res.body).toHaveProperty('userId');
    authToken = res.body.token;
  });
});

describe('Group Routes', () => {
  test('POST /api/groups', async () => {
    const res = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Group',
        admins: [userId],
        members: [userId]
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    groupId = res.body._id;
  });

  test('GET /api/groups', async () => {
    const res = await request(app)
      .get('/api/groups')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /api/groups/user-groups', async () => {
    const res = await request(app)
      .get('/api/groups/user-groups')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /api/groups/:groupId', async () => {
    const res = await request(app)
      .get(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', groupId);
  });

  test('PUT /api/groups/:groupId', async () => {
    const res = await request(app)
      .put(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Updated Test Group'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Test Group');
  });

  test('POST /api/groups/:groupIdOrName/join-request', async () => {
    const res = await request(app)
      .post(`/api/groups/${groupId}/join-request`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('GET /api/groups/admin/pending-requests', async () => {
    const res = await request(app)
      .get('/api/groups/admin/pending-requests')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('POST /api/groups/admin/approve-request/:groupId/:userId', async () => {
    const res = await request(app)
      .post(`/api/groups/admin/approve-request/${groupId}/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });
});

describe('Chat Room Routes', () => {
  test('POST /api/chatrooms', async () => {
    const res = await request(app)
      .post('/api/chatrooms')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        name: 'Test Chat Room',
        groupId: groupId
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    chatRoomId = res.body._id;
  });

  test('GET /api/chatrooms', async () => {
    const res = await request(app)
      .get('/api/chatrooms')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('GET /api/chatrooms/group/:groupId', async () => {
    const res = await request(app)
      .get(`/api/chatrooms/group/${groupId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('PUT /api/chatrooms/:chatRoomId', async () => {
    const res = await request(app)
      .put(`/api/chatrooms/${chatRoomId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        chatRoomName: 'Updated Test Chat Room'
      });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('chatRoomName', 'Updated Test Chat Room');
  });
});

describe('Message Routes', () => {
  test('POST /api/messages', async () => {
    const res = await request(app)
      .post('/api/messages')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        chatRoomId: chatRoomId,
        userId: userId,
        msgContent: 'Test message'
      });
    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    messageId = res.body._id;
  });

  test('GET /api/messages/:chatRoomId', async () => {
    const res = await request(app)
      .get(`/api/messages/${chatRoomId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

describe('User Routes', () => {
  test('GET /api/users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });

  test('POST /api/users/:userId/promote-group-admin/:groupId', async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/promote-group-admin/${groupId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(res.body.roles).toContain('groupAdmin');
  });

  test('POST /api/users/:userId/promote-super-admin', async () => {
    const res = await request(app)
      .post(`/api/users/${userId}/promote-super-admin`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('roles');
    expect(res.body.roles).toContain('super');
  });

  test('GET /api/users/:userId/admin-groups', async () => {
    const res = await request(app)
      .get(`/api/users/${userId}/admin-groups`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBeTruthy();
  });
});

describe('Settings Routes', () => {
  test('GET /api/settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('username');
  });

  test('PUT /api/settings/:setting', async () => {
    const res = await request(app)
      .put('/api/settings/dark_mode')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ value: true });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('dark_mode', true);
  });

  // Note: Testing file upload requires a different approach
  // This is a placeholder for the profile picture upload test
  test('POST /api/settings/profile-picture', async () => {
    // Implementation depends on how you handle file uploads
  });
});

describe('Cleanup', () => {
  test('DELETE /api/users/:userId', async () => {
    const res = await request(app)
      .delete(`/api/users/${userId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('DELETE /api/chatrooms/:id', async () => {
    const res = await request(app)
      .delete(`/api/chatrooms/${chatRoomId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });

  test('DELETE /api/groups/:groupId', async () => {
    const res = await request(app)
      .delete(`/api/groups/${groupId}`)
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.statusCode).toBe(200);
  });
});
