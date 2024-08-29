import { Component, OnInit } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationError } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as toastr from "toastr";
import { AuthenticationService, AuthResponse } from '../services/authentication.service';
import {SettingsService} from "../settings.service";
import {NavigationService} from "../services/navigation.service";

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
    private navigationService: NavigationService,
    // private settingsService: SettingsService
  ) { }

  ngOnInit() {
    // Check if user is already logged in
    this.authService.isAuthenticated().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        console.log('User is already logged in. Navigating to dashboard.');
        this.navigationService.navigateToDashboard();
      } else {
        console.log('User not logged in. Staying on login page.');
      }
    });
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
          this.navigationService.navigateToDashboard();
        } else if (!response) {
          console.log('Login unsuccessful, bad response');
          toastr.error('Login failed. You have likely entered the wrong credentials', 'Try again');

        } else if (!response.token) {
          console.log('Token unsuccessful');
        }

      },
      error: (err) => {
        console.error('Login error:', err);
        toastr.error('Oh dear, something bad happened. You broke something.', 'Error');
      }
    });
  }

  onRegister() : void { // register text click
    this.navigationService.navigateToRegisterUser();
  }

}
