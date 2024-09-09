import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import * as toastr from "toastr";
import { AuthenticationService } from './services/authentication.service';
import { SettingsService} from "./settings.service";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'message-app';

  constructor(
    private router: Router,
    private authService: AuthenticationService,
    private settingsService: SettingsService) {}

  ngOnInit(): void {
    console.log('\nAttempting to read token..');
    if (this.settingsService.showDebugLogs)
      toastr.info('reading token...');

    if ( this.authService.isTokenExpired()) {
      this.router.navigate(['/login']).then(
        ()=> console.log('Token Expired.'));
    } else {
      this.router.navigate(['/dashboard']).then(
        ()=> console.log('Token Valid!'));
    }
  }


}
