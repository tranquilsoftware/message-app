import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of, BehaviorSubject, switchMap, throwError} from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from "@angular/router";

import { JwtHelperService } from '@auth0/angular-jwt';

//client side interface models
export interface AuthResponse {
  token: string;
  expiresIn: number;
  userId: string;
}

export interface UserSettings {
  name: string;
  email: string;
  birthdate: string;
  profile_pic: string;
  dark_mode: boolean;
  notifications: boolean;
}

export interface Group {
  _id: string;
  name: string;
  chat_rooms: ChatRoom[];
}

export interface ChatRoom {
  _id: number;
  name: string;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  profile_pic: string;
  // this is for client msging display (UI)
}

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiLoginUrl = 'http://localhost:5000/api/login';
  private apiRegisterUserUrl = 'http://localhost:5000/api/register';
  private apiUrl = 'http://localhost:5000/api/';
  private authStatusSubject = new BehaviorSubject<boolean>(this.isTokenValid());




  // current user data types
  private currentUserIdSubject: BehaviorSubject<string | null>;

  private currentUser: User | null = null;
  public currentUserId:  Observable<string | null>; // this gets set on login.it is the _id attribute of the user.



  constructor(private http: HttpClient, private router: Router) {
    this.checkAuthStatus();


    this.currentUserIdSubject = new BehaviorSubject<string | null>(localStorage.getItem('current_user_id'));
    this.currentUserId = this.currentUserIdSubject.asObservable();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiLoginUrl, { username, password })
      .pipe(
        tap(response => {
          this.setSession(response);
          this.setCurrentUserId(response.userId); // Saves the user ID (_id), and current_user_id to localStorage

        }),
        catchError(this.handleError<AuthResponse>('login'))
      );

  }

  registerUser(username: string, password: string, email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiRegisterUserUrl, { username, password, email })
      .pipe(
        tap(response => {
          this.setSession(response);
          this.setCurrentUserId(response.userId); // save the user ID (_id in mongoDB)

        }),
        catchError(this.handleError<AuthResponse>('registerUser'))
      );

  }


  private setSession(authResult: AuthResponse): void {
    const expiresAt = new Date().getTime() + authResult.expiresIn * 1000;

    localStorage.setItem('auth_token', authResult.token);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt));
    this.authStatusSubject.next(true);
  }

  logout() {
    // clear all relevants
    localStorage.removeItem('expires_at')
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user_id');

    this.currentUserIdSubject.next(null);
    this.currentUser = null;

    this.authStatusSubject.next(false);

    // navigate back to logins
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
    const token = this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    return this.http.get<UserSettings>('http://localhost:5000/api/user/settings', { headers });
  }

  updateUserSetting(setting: string, value: any): Observable<any> {
    // set token to header
    const token =  this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // http put request
    return this.http.put(`${this.apiUrl}user/settings/${setting}`, { value }, { headers });
  }


//TODO fixup -- MongoDB To accept pp
  uploadProfilePicture(file: File): void {
    const formData = new FormData();
    formData.append('profilePicture', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}` // Replace with your method to get the token
    });


    this.http.post('/api/user/profile-picture', formData, { headers }).subscribe(
      (response: any) => {
        // this.user.profile_pic = response.url;
        console.log('Profile picture was uploaded successfully!');
      },
      (error) => {
        console.error('Oh no! Something went wrong when uploading profile picture!', error);
      }
    );
  }

  // End User Setting Functions



  private handleError<T>(operation = 'operation', result?: T) {
    return (error: HttpErrorResponse): Observable<T> => {
      console.error(`${operation} failed: ${error.message}`);
      return of(result as T);
    };
  }






  // USER ID FUNCTIONS

  private get currentUserIdValue(): string | null {
    return this.currentUserIdSubject.value;
  }

  public getCurrentUserId() {
    return this.currentUserIdValue;
  }

  // After successful login, this method is called.
  setCurrentUserId(userId: string): void {
    this.currentUserIdSubject.next(userId);
    localStorage.setItem('current_user_id', userId);
  }

  // Retrieve the current user's ID
  getCurrentUser(): Observable<User | null> {
    // const token = this.getToken();
    // const token = localStorage.getItem('auth_token');
    const token = this.getToken();
    console.log('(getCurrentUser) - Token:', token);

    if (!token) {
      console.error('No token found, user is likely not authenticated!')
      return throwError(() => new Error('User probably not authenticated'));
    }


    return this.http.get<User>('http://localhost:5000/api/user/current').pipe(
      catchError((error) => {
        console.error('Error in getCurrentUser:', error);

        if( error.status === 401) {
          console.error('Unauthorized access, token invalid or expired?');
        }
        return throwError(() => new Error('Failed to fetch current user'));
      })
    );
  }

  // getCurrentUser(): Observable<User | null> {
  //   return this.currentUserId.pipe(
  //     switchMap(userId => {
  //       if (!userId) {
  //         return of(null);
  //       }
  //       if (this.currentUser && this.currentUser._id === userId) {
  //         return of(this.currentUser);
  //       }
  //       return this.http.get(`/api/users/${userId}`, { responseType: 'text' }).pipe(
  //         tap(rawResponse => console.log('Raw API response:', rawResponse)),
  //         map(rawResponse => {
  //           const user = JSON.parse(rawResponse) as User;
  //           this.currentUser = user;
  //           return user;
  //         }),
  //         catchError(error => {
  //           console.error('Error fetching or parsing user data:', error);
  //           return of(null);
  //         })
  //
  //       );
  //     })
  //   );
  // }

}


