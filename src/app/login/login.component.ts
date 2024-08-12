import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as toastr from "toastr";
import { AuthenticationService, AuthResponse } from '../services/authentication.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  m_username: string = '';
  m_password: string = '';

  constructor(private authService: AuthenticationService, private router: Router) {
    // Subscribe to router events for debugging
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        console.log('Navigation started:', event.url);
      }
      if (event instanceof NavigationEnd) {
        console.log('Navigation ended:', event.url);
      }
      if (event instanceof NavigationError) {
        console.log('Navigation error:', event.error);
      }
    });
  }

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isLoggedIn()) {
      console.log('User is already logged in. Navigating to dashboard.');
      this.navigateToDashboard();
    }
  }

  onSubmit() {
    console.log('Login attempt for user:', this.m_username);

    // begin login with authentication service
    this.authService.login(this.m_username, this.m_password).subscribe({
      next: (response: AuthResponse) => {
        console.log('Login response:', response);
        if (response && response.token) {
          console.log('Login successful, attempting navigation to dashboard');
          this.authService.setAuthToken(response.token);
          this.navigateToDashboard();
        } else {
          console.log('Login unsuccessful');
          toastr.error('Login failed. You have likely entered the wrong credentials', 'Try again');
        }
      },
      error: (err) => {
        console.error('Login error:', err);
        toastr.error('Oh dear, something bad happened. You broke something.', 'Error');
      }
    });
  }

  private navigateToDashboard() {
    this.router.navigate(['/dashboard']).then((success) => {
      console.log('Navigation result:', success);
      if (success) {
        toastr.success('You have logged in successfully.');
      } else {
        toastr.error('Navigation failed');
      }
    }).catch(err => {
      console.error('Navigation error:', err);
      toastr.error('Navigation to dashboard failed.', 'Error');
    });
  }
}
