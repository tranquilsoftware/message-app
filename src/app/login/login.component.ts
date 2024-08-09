import { Component } from '@angular/core';
import {Router} from "@angular/router";

// For login form UI
import {  CommonModule } from "@angular/common";
import {  FormsModule } from "@angular/forms";

// for notifications (lightweight framework)
import toastr from 'toastr';

// Important relevant members
import { AuthenticationService } from '../services/authentication.service';


@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})

export class LoginComponent {

  // Define login parameters to empty strings first.
  m_username: string = '';
  m_password: string = '';
  m_isLoggedIn = false;

  constructor(private authService : AuthenticationService, private router : Router) {
    // ... add to constructor as we need
  }

  onSubmit() {
    this.authService.login(
      this.m_username, this.m_password).subscribe({
      next: (onSuccess) => {
        if (onSuccess) {
          // If we successfully login, tell the webpage to navigate to Dashboard.
          //   and set our localised loggedIn boolean to true.
          this.router.navigate(['/dashboard']).then(r => this.m_isLoggedIn = true);
        } else {
          toastr.error('Login failed. You have likely entered the wrong credentials', 'Try again');
        }


      },
      error: (err) => {
        toastr.error('Oh dear, something bad happened. You broke something.', 'Error');
      }
    });
  }
}
