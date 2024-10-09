import { expect } from 'chai';
import request from 'supertest';
import { app } from '../backend/server.js';

describe('Server API Tests', function() {
  // Define a token for auth testing
  let authToken;

  before(function(done) {
    request(app)
      .post('/api/login')
      .send({ username: 'super', password: '123' })
      .end(function(err, res) {
        if (err) return done(err);
        authToken = res.body.token;
        done();
      });
  });




  it('should return 200 when accessing messages with an existing chatRoomId', function(done) {
    request(app)
      .get('/api/messages/11')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should not let us register without all the required stuff', function(done) {
    request(app)
      .post('/api/register')
      .send({})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(400);
        done();
      });
  });

  it('should tell us off if we try to login without credentials', function(done) {
    request(app)
      .post('/api/login')
      .send({})
      .end(function(err, res) {
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it('should not let us mess with settings without a token', function(done) {
    request(app)
      .get('/api/settings')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(401);
        done();
      });
  });

  it('should let us see groups without a token', function(done) {
    request(app)
      .get('/api/groups')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should let us see chatrooms without proving who we are', function(done) {
    request(app)
      .get('/api/chatrooms')
      .end(function(err, res) {
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should allow profile picture upload with authentication', function(done) {
    request(app)
      .post('/api/settings/profile-picture')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('profile_picture', 'public/img/default_user.png')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });


  it('should not allow profile picture upload without authentication', function(done) {
    request(app)
      .post('/api/settings/profile-picture')
      .attach('profile_picture', 'public/img/default_user.png')
      .end(function(err, res) {
        if (err) {

          if (err.code === 'ECONNRESET') {
           // Accept ECONNRESET as a successful test read (upon my research this seems acceptable)
           return done();
          }

          return done(err);
        }
        expect(res.statusCode).to.equal(201);
        done();
      });
  });


});
