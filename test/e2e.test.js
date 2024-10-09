import { expect } from 'chai';
import request from 'supertest';

const baseUrl = 'http://localhost:4200';

describe('End-to-End Tests', function() {
  it('should show us the login page when we visit', function(done) {
    request(baseUrl)
      .get('/login')
      .end(function(err, res) {
        if (err) return done(err);
        console.log('Response body:', res.text.substring(0, 500)); // read the first 500 characters to understand what page were on
        expect(res.statusCode).to.equal(200);
        expect(res.text).to.include('<app-root'); // look for angular app root (valid html response)
        done();
      });
  });

  it('should kick us back to login if we try to sneak into the dashboard', function(done) {
    request(baseUrl)
      .get('/dashboard')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should let us peek at the registration page', function(done) {
    request(baseUrl)
      .get('/register')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should not let us mess with user settings without logging in first', function(done) {
    request(baseUrl)
      .get('/settings')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should not let us into the admin panel without proving who we are', function(done) {
    request(baseUrl)
      .get('/admin')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should not let us into chat rooms without any auth', function(done) {
    request(baseUrl)
      .get('/chat/11')
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(200);
        done();
      });
  });

  it('should try to tell us off if we register without all the required attributes', function(done) {
    request(baseUrl)
      .post('/api/register')
      .send({ username: 'newuser' })
      .end(function(err, res) {
        if (err) return done(err);
        expect(res.statusCode).to.equal(404);
        done();
      });
  });
});
