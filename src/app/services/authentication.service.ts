import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse, HttpHeaders} from '@angular/common/http';
import {Observable, of, BehaviorSubject, switchMap, throwError} from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Router } from "@angular/router";

//client side interface models
export interface AuthResponse {
  token: string;
  expiresIn: number;
  userId: string;
}

export interface UserSettings {
  username: string;
  email: string;
  birthdate: string;
  profile_pic: string;
  dark_mode: boolean;
  notifications: boolean;
}

// this is for client msging display (UI)

export interface Group {
  _id: string;
  groupId: string;  // changed from _id
  name: string;
  chatrooms: ChatRoom[];
  isExpanded: boolean; // Client sided, if user wants to open group this is true.
  members: User[];
  admins: User[];
  pendingRequests: User[];
}


// Also known as; Channels.
export interface ChatRoom {
  _id: string;
  groupId: string;  // (BELONGS TO id of GROUP )
  chatRoomName: string; // the unique channel/chatroom name
  chatRoomId: string;
  createdAt: string;
  // lastMessage: string | null;
}

export interface User {
  _id: string;
  username: string;
  email: string;
  profile_pic: string;
  roles: string[];
  groups: string[];
  adminInGroups: string[];
}



@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiLoginUrl = 'http://localhost:5000/api/login';
  private apiRegisterUserUrl = 'http://localhost:5000/api/register';
  public  apiUrl = 'http://localhost:5000/api/';
  private authStatusSubject = new BehaviorSubject<boolean>(this.isTokenValid());
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();
  private lastFetchTime: number = 0;
  private readonly fetchInterval: number = 60000; // 1 minute

  // current user data types
  private currentUserIdSubject: BehaviorSubject<string | null>;

  public currentUserId:  Observable<string | null>; // this gets set on login.it is the _id attribute of the user.



  constructor(
    private http: HttpClient,
    private router: Router) {
    this.checkAuthStatus();

    const localisedUserId = localStorage.getItem('current_user_id');

    this.currentUserIdSubject = new BehaviorSubject<string | null>(localisedUserId);
    this.currentUserId = this.currentUserIdSubject.asObservable();
  }

  login(username: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiLoginUrl, { username, password })
      .pipe(
        tap(response => {
          this.setSession(response);
          console.log('response', response);

        }),
        catchError(this.handleError<AuthResponse>('login'))
      );

  }

  registerUser(username: string, password: string, email: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(this.apiRegisterUserUrl, { username, password, email })
      .pipe(
        tap(response => {
          this.setSession(response);

        }),
        catchError(this.handleError<AuthResponse>('registerUser'))
      );

  }


  private setSession(authResult: AuthResponse): void {
    const token = authResult.token;
    const decodedToken = this.jwtDecode(token);
    const expiresAt = new Date().getTime() + (authResult.expiresIn * 1000);

    localStorage.setItem('auth_token', decodedToken.token);
    localStorage.setItem('expires_at', JSON.stringify(expiresAt));
    this.authStatusSubject.next(true);

    const userId = decodedToken.userId;
    this.setCurrentUserId(userId);// save the user ID (_id in mongoDB)

  }

  logout() {
    // clear all relevant attributes
    localStorage.removeItem('expires_at')
    localStorage.removeItem('auth_token');
    localStorage.removeItem('current_user_id');
    localStorage.removeItem('dark_mode')

    this.currentUserIdSubject.next(null);

    this.authStatusSubject.next(false);

    // navigate back to logins
    this.router.navigate(['/login']).then(r => console.log("Attempting to navigate to /login!"));
  }

  // Token Validation..
  private isTokenValid(): boolean {
    const token = this.getToken();

    if (!token) {
      console.log('Token is null or empty');
      return false;
    }

    try {
      const decodedToken = this.jwtDecode(token);
      const currentTime = Date.now() / 1000;

      if (!decodedToken.exp || decodedToken.exp < currentTime) {
        console.log('Token is expired');
        return false;
      }

      console.log('Token is valid');
     // Return true if token; isn't null, has a string of characters, AND valid with JWT

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      return false;
    }
  }


  isTokenExpired(): boolean {
    return !this.isTokenValid();
  }

  public getToken(): string | null {
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
    return this.http.get<UserSettings>('http://localhost:5000/api/settings', { headers });
  }

  updateUserSetting(setting: string, value: any): Observable<any> {
    // set token to header
    const token =  this.getToken();
    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // http put request
    return this.http.put(`${this.apiUrl}settings/${setting}`, { value }, { headers });
  }


  uploadProfilePicture(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('profile_picture', file);

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${this.getToken()}` // Replace with your method to get the token
    });


    return this.http.post(`${this.apiUrl}user/profile-picture`, formData, { headers }).pipe(
      tap((response:any) => {
        console.log('Profile picture was uploaded successfully! :D.\n Response URL: ', response.url);

      }),

      catchError((error) => {
        console.error('Oh dear! Something went wrong when uploading profile picture!', error);
        return throwError(() => new Error('Profile picture upload failed'));
      })
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

  public getCurrentUserId(): string | null {
    const token = this.getToken();
    if (!token) {
      return null;
    }

    try {
      const decodedToken = this.jwtDecode(token);
      console.log('(getCurrentUserId) - Decoded Token:', decodedToken);
      return decodedToken.userId;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  private jwtDecode(token: string): any {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  }


  // After successful login, this method is called.
  setCurrentUserId(userId: string): void {
    this.currentUserIdSubject.next(userId);
    console.log('(setCurrentUserId) - User ID:', userId);
    localStorage.setItem('current_user_id', userId);
  }

  // Retrieve the current user's ID
  getCurrentUser(): Observable<User | null> {
    const now = Date.now();
    if (this.currentUserSubject.value && now - this.lastFetchTime < this.fetchInterval) {
      return of(this.currentUserSubject.value);
    }

    const token = this.getToken();
    if (!token) {
      console.error('No token found, user is likely not authenticated!');
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.http.get<User>(`${this.apiUrl}settings/current`, {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    }).pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        this.lastFetchTime = now;
      }),
      catchError(error => {
        console.error('Error fetching current user:', error);
        this.currentUserSubject.next(null);
        return of(null);
      })
    );
  }

  hasRole(role: string): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => user ? user.roles.includes(role) : false)
    );
  }

  getAdminGroups(): Observable<string[]> {
    return this.getCurrentUser().pipe(
      map(user => user ? user.adminInGroups : [])
    );
  }


}


