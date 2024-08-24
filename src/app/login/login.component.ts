import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as toastr from "toastr";
import { AuthenticationService, AuthResponse } from '../services/authentication.service';
import {SettingsService} from "../settings.service";

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

  constructor(
    private authService: AuthenticationService,
    private router: Router,
    private settingsService: SettingsService) { }

  ngOnInit() {
    // Check if user is already logged in
    if (this.authService.isAuthenticated()) {
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
      if (success && this.settingsService.showDebugLogs) {
        toastr.success('You have logged in successfully.');
      } else if (this.settingsService.showDebugLogs) {
        toastr.error('Navigation failed');
      }
      console.log('Navigation result:', success);

    }).catch(err => {
      console.error('Navigation error:', err);
      toastr.error('Navigation to dashboard failed.', 'Error');
    });

  }
}
