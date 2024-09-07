import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {AuthenticationService, UserSettings} from "../services/authentication.service";
import {Router} from "@angular/router";
import {HttpHeaders} from "@angular/common/http";
// const { generateToken } = require('../src/app/services/authUtils'); // for mkaing JWT Tokens.


/*
TODO Functions:
  shows privilige power ON SETTINGS (super admin, group admin, user etc), shows user profile image
 */

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './settings.component.css',
  template: `
    <div class="settings-dashboard">
    <header>
      <h1>Settings</h1>
    </header>

    <main>
    <!--  Profile picture -->
      <div class="profile-section">
        <div class="profile-picture" (click)="onProfilePictureClick()">
          <img [src]="user.profile_pic || '/img/default_user.png'" alt="Profile Picture">
          <div class="change-overlay">Change</div>
        </div>
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
      </div>

      <div class="settings-section">

        <!--        Birthdate    -->
        <div class="setting-item">
          <span>Birthdate</span>
          <label class="date">
            <input type="date" [(ngModel)]="user.birthdate" (change)="updateSetting('birthdate', user.birthdate)">
          </label>
        </div>

        <!--   Dark Mode   -->
        <div class="setting-item">
          <span>Dark Mode</span>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="user.dark_mode" (change)="updateSetting('dark_mode', user.dark_mode)">
            <span class="slider"></span>
          </label>
        </div>

        <!--   Notifications   -->
        <div class="setting-item">
          <span>Notifications</span>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="user.notifications" (change)="updateSetting('notifications', user.notifications)">
            <span class="slider"></span>
          </label>
        </div>

      </div>
    </main>


    <!-- Navigation Bar -->
    <nav class="bottom-nav">
      <button (click)="goToDashboard()">Dashboard</button>
      <button class="active">Settings</button>
      <button (click)="authService.logout()">Logout</button>
    </nav>
  </div>
  `
})
export class SettingsComponent implements OnInit {
  user: UserSettings = {
    name:           '',     // Display name of profile, could be full name or alias.
    email:          '',     // Users email address.
    birthdate:      '',     // String of users birthdate
    profile_pic:    '',     // Path to profile picture on web server
    dark_mode:      false,  // TODO: implement dark mode (changes to css styling)
    notifications:  true    // todo: this is a placeholder for notifications to  be sent the the user, in some form of wahy.;
  }

  constructor(
    public authService: AuthenticationService,
    private router: Router)
  {}

  ngOnInit(): void {
    this.loadUserSettings();
  }

  goToDashboard() : void {
    this.router.navigate(['/dashboard']);
  }
  loadUserSettings(): void {
    this.authService.getUserSettings().subscribe(
      settings => {
        this.user = settings;
        console.log('Loaded user settings:', this.user); // Add this for debugging
      },
      error => {
        if (error.status === 401) {
          console.error('Unauthorized access - perhaps the user is not logged in or the session has expired.');
        } else {
          console.error('Error loading user settings:', error);
        }
      }
    );
  }


  updateSetting(setting: string, value: boolean | string): void {
    console.log(`Attempting to update ${setting} to ${value}`);
    this.authService.updateUserSetting(setting, value).subscribe(
      () => {
        console.log(`${setting} updated successfully!`);
      },
      error => {
        console.error(`Error updating ${setting}, used value: ${value}:`, error);
        // Show an error message to the user
        alert(`Failed to update ${setting}. Please try again later.`);
      }
    );
  }



  // Profile picture functions below...

  onProfilePictureClick(): void {
    if (confirm('Are you sure you want to change your profile picture?')) {
      this.pickAProfilePicture();
    }
  }

  pickAProfilePicture(): void {
    const input = document.createElement('input');
    input.type      = 'file';
    input.accept    = 'image/*';
    input.onchange  = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.uploadProfilePicture(file);
      }
    };

    input.click();
  }

  // sends uploaded pic to the authentication service, which tells server.js to update.
  uploadProfilePicture(file: File): void {
    this.authService.uploadProfilePicture(file);
  }


}
