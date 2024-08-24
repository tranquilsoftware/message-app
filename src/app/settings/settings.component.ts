import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {AuthenticationService, UserSettings} from "../services/authentication.service";
// import {response} from "express";
import { DashboardComponent } from "../dashboard/dashboard.component";
import {Router} from "@angular/router";

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
      <div class="profile-section">
        <div class="profile-picture" (click)="onProfilePictureClick()">
          <img [src]="user.profile_pic || '/img/default_user.png'" alt="Profile Picture">
          <div class="change-overlay">Change</div>
        </div>
        <h2>{{ user.name }}</h2>
        <p>{{ user.email }}</p>
      </div>

      <div class="settings-section">
        <div class="setting-item">
          <span>Dark Mode</span>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="user.dark_mode" (change)="updateSetting('darkMode', user.dark_mode)">
            <span class="slider"></span>
          </label>
        </div>
        <div class="setting-item">
          <span>Notifications</span>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="user.notifications" (change)="updateSetting('notifications', user.notifications)">
            <span class="slider"></span>
          </label>
        </div>

      </div>
    </main>



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
    // TODO implement actual settings that load things into local storage, etc.
    this.authService.getUserSettings().subscribe(
      (settings) => {
        this.user = settings;
      },
      (error) => {
        console.error('Error loading user settings:', error);
      }
    );
  }

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

  uploadProfilePicture(file: File): void {
    // TODO implement actual file upload to tserver, and update the user's profile picture path? or simply override pic.jpg, (maybe every user can have there own pic.jpg)
    this.authService.uploadProfilePicture(file).subscribe(
      (response) => {
        this.user.profile_pic = response.url;
        console.log('Profile picture was uploaded successfully!');
      },
      (error) => {
        console.error('Oh no! Something went wrong when uploading profile picture!', error);
      }
    );
  }

  updateSetting(setting: string, value: boolean): void {
    // todo implement actual setting update of user, we would store this information inside the users mongodb file.

    this.authService.updateUserSetting(setting, value).subscribe(
      () => {
        console.log(`${setting} updated successfully!`);
      },
      (error) => {
        console.error(`Error updating ${setting}`, error);
      }
    );

  }


}
