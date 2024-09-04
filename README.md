# MessageApp

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 18.1.4.
## Angular Components

### Login

I wanted to keep the login form as simple as possible. Nothing incredible here. Simply serves to login, generate a token and authorise the user to login for a certain amount of time (currently 1 hour).

Components: Username, password fields, with a login button.


### Register User

The register form POSTs the user information to our database. Before the raw string password is passed into the registration operation, we hash the password using bcrypt. The hash is using a seed stored in the environment file.

Storing a password in a text file would never take place in a production codebase.

### Dashboard

- shows different chat items in bubbles (individuals or group chats)
- navigation bar (dashboard, settings, logout)

###

Chat Room

The main interface for real time message and video communication, between two people or a group.  
Components:

1. header (profile name/group name)
2. Message display container (where messages pop up)
3. Message input box (at the bottom of screen)
4. Display how many people are in room
5. Send button (_little paper airplane_ icon next to message input box)

### Settings

Allow a user to change their accounts attributes, such as:

1. Profile picture
2. Birth-date
3. Dark mode
4. Notifications

### Super User (Admin) Panel

A super user is a hardcoded user to be built into our framework. \[user: super, pass: 123\]

## Angular Services

###

Socket

The Socket service provides us a service, that we can use within our framework to communicate using Socket.io. It declares signals that are used for communicating to our web server, to pass information over to another component or save certain information.

###

Authentication

The frameworks Authentication service is more comprehensive as opposed to our other services. As it is used quite often; to retrieve the current user information,

### AuthGuard

Within the framework, there is an Angular service named _AuthGuard_ that we ensure users are routed correctly, but only when they are correctly authenticated.

E.g. We should route to the dashboard after the login, only when the login credentials are correct.

### AuthInterceptor

This service provides an authorization header to the user’s outgoing HTTP requests. It is needed to authenticate users. It is written under _auth.interceptor.ts_, and we attach it within the _providers_ section of our AppModule (_app.module.ts_).

Navigation  
The Navigation service was made to easily, and correctly route the user to the right web page, without unnecessary lines of code. A DRY (Don’t-Repeat-Yourself) approach that was taken during development.

It will also prompt the developer console of a successful route, or else a detailed error message.

### Settings

Programmer variables, only has settings for showing debug logs currently.
