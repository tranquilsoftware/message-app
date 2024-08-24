import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from "@angular/router";

import { JwtHelperService } from '@auth0/angular-jwt';

export interface AuthResponse {
  token: string;
  expiresIn: number;
}

export interface UserSettings {
  name: string;
  email: string;
  profile_pic: string;
  dark_mode: boolean;
  notifications: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiLoginUrl = 'http://localhost:5000/api/login';
  private apiUrl = 'http://localhost:5000/api/';
  private authStatusSubject = new BehaviorSubject<boolean>(this.isTokenValid());

  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiLoginUrl, { username, password })
      .pipe(
        tap(response => this.setSession(response)),
        // map(response => !!response.token),
        catchError(this.handleError<AuthResponse>('login'))
      );
  }


  private setSession(authResult: AuthResponse): void {
    const expiresAt = new Date().getTime() + authResult.expiresIn * 1000;
    localStorage.setItem('auth_token', authResult.token);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt));
    this.authStatusSubject.next(true);
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.authStatusSubject.next(false);
    this.router.navigate(['/login']).then(r => console.log("Attempting to navigate to /login!"));
  }

  // Token Validation..

  private isTokenValid(): boolean {
    const token = this.getToken();

    const result = token !== null && token !== '';

    console.log('Token result: [', result, ']');

    // Return true if token; isn't null, has a string of characters, AND valid with JWT
    return token !== null && token !== '';
  }

  isTokenExpired(): boolean {
    return !this.isTokenValid();
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  public setAuthToken(token: string): void {
    localStorage.setItem('auth_token', token);
    this.authStatusSubject.next(true);
  }

  private checkAuthStatus(): void {
    const token = this.getToken();
    if (this.isTokenExpired()) {
      this.authStatusSubject.next(false);
      this.router.navigate(['/login']).then(() => {
        console.log("Navigating to login as the token is expired.");
      });
    } else {
      this.authStatusSubject.next(true);
    }
  }

  isAuthenticated(): Observable<boolean> {
    return this.authStatusSubject.asObservable();
  }


  // User Setting functions..

  getUserSettings(): Observable<UserSettings> {
    return this.http.get<UserSettings>(`${this.apiUrl}/user/settings`, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      catchError(this.handleError<UserSettings>('getUserSettings'))
    );
  }

  updateUserSetting(setting: string, value: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/user/settings/${setting}`, { value }, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      catchError(this.handleError<any>('updateUserSetting'))
    );
  }

  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profilePicture', file);

    return this.http.post(`${this.apiUrl}/user/profile-picture`, formData, {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    }).pipe(
      catchError(this.handleError<any>('uploadProfilePicture'))
    );
  }

  // End User Setting Functions



  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }

}


