import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import {AuthenticationService} from "./authentication.service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthenticationService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler) {
    const token = this.authenticationService.getToken();
    console.log('(Authentication Interceptor) - Token:', token);

    const authRequest = request.clone({
      headers: request.headers.set("Authorization", "Bearer " + token)
    });

    return next.handle(authRequest);
  }
}
