import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  private apiUrl = 'http://localhost:4200/api';

  constructor(private http: HttpClient) { }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<{ token: string }>(`${this.apiUrl}/login`, { username, password })
      .pipe(
        tap(response => this.setSession(response)),
        map(response => !!response.token), // Convert to boolean based on token presence
        catchError(this.handleError<boolean>('login', false))
      );
  }

  private setSession(authResult : {token: string}) {
    localStorage.setItem('id_token', authResult.token);
  }

  logout() {
    localStorage.removeItem('id_token');
  }

  isLoggedIn() {
    // return result of if id token exists in local storage
    //  e.g. (id_token = 'xxxx' = returns True),
    //       (id_token =  NULL = returns False)
    return !!localStorage.getItem('id_token');
  }

  // Handle template error. Simply prints any error that comes to us to the web browsers console
  private handleError<T>(operation = 'operation', result?: T) {
    return (anError: any): Observable<T> => {
      console.error(anError); // print error to developer console
      return of(result as T);
    };
  }
}
