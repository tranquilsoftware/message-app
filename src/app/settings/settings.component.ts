import {Component, OnInit} from '@angular/core';
import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {AuthenticationService, UserSettings} from "../services/authentication.service";
import {NavigationService} from "../services/navigation.service";
import { DarkModeService } from '../services/dark-mode.service';


@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './settings.component.css',
  templateUrl: './settings.component.html'
})
export class SettingsComponent implements OnInit {
  user: UserSettings = {
    username:       '',     // Display name of profile, could be full name or alias.
    email:          '',     // Users email address.
    birthdate:      '',     // String of users birthdate
    profile_pic:    '',     // Path to profile picture on web server
    dark_mode:      false,
    notifications:  true    // todo: this is a placeholder for notifications to  be sent the the user, in some form of wahy.;
  }

  isGroupAdmin: boolean = false;
  isSuperAdmin: boolean = false;
  isUploadingProfilePicture: boolean = false;

  constructor(
    public authenticationService: AuthenticationService,
    public navigationService: NavigationService,
    private darkModeService: DarkModeService
  ) {}

  ngOnInit(): void {
    this.loadUserSettings();
    this.checkUsersRoles();
  }

  checkUsersRoles(): void {
    this.authenticationService.hasRole('groupAdmin').subscribe(isGroupAdmin => {
      this.isGroupAdmin = isGroupAdmin;
    });

    this.authenticationService.hasRole('super').subscribe(isSuperAdmin => {
      this.isSuperAdmin = isSuperAdmin;
    });
  }

  toggleDarkMode(): void {
    this.darkModeService.toggleDarkMode();
  }

  goToDashboard(): void {
    this.navigationService.navigateToDashboard();
  }

  loadUserSettings(): void {
    this.authenticationService.getUserSettings().subscribe(
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
    this.authenticationService.updateUserSetting(setting, value).subscribe(
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
    this.isUploadingProfilePicture = true;
    this.authenticationService.uploadProfilePicture(file).subscribe({
      next: (response: any) => {

        this.isUploadingProfilePicture = false;
        this.user.profile_pic = response.url; // client sided only request

        console.log('The profile pic should be updated!');
        },
      error: (error) => {
        this.isUploadingProfilePicture = false;
      }
    });  }


}
