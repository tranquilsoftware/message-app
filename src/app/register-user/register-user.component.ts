import { Component, OnInit } from '@angular/core';
import { Router } from "@angular/router";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import * as toastr from "toastr";
import { AuthenticationService } from '../services/authentication.service';
import {NavigationService} from "../services/navigation.service";

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [
    FormsModule, CommonModule
  ],
  templateUrl: './register-user.component.html',
  styleUrl: './register-user.component.css',

})
export class RegisterUserComponent implements OnInit {
  username: string = '';
  password: string = '';
  confirm_password: string = '';
  email: string = '';

  constructor(
    private authService: AuthenticationService,
    private navigationService: NavigationService
  ) { }

  ngOnInit(): void {

  }

  onSubmit() {
    // Check if password and confirm password field are same..
    if (this.password !== this.confirm_password) {
      return toastr.error('Passwords do not match.', 'Password Match Error');
    }

    // Safe to register user..
    this.authService.registerUser(this.username, this.password, this.email).subscribe( {
      next: (response) => {
        console.log('Registration response: ', response);

        this.authService.login(this.username, this.password).subscribe( (bool) => {
          console.log('Logged in successfully after registering!');
          this.authService.setAuthToken(response.token);
          this.navigationService.navigateToDashboard();
        });

      },
      error: (err) => {
        console.error('Registration error:', err);
        toastr.error('Oh dear, something bad happened. You broke something.', 'Error');
      }
    }
    );
  }

}
