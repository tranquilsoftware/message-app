import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor() {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('auth_token');
    console.log('Interceptor - Token:', token);


    if (token) {
      console.log('\nauth_token WAS found! (Auth.Interceptor)');
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('Interceptor - Modified request:', request);
    } else {
      console.error(' BAD ERROR. auth_token could not be found! (Auth.Interceptor)');
    }

    return next.handle(request);
  }
}
