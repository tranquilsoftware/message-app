import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as toastr from "toastr";
import { SettingsService } from '../settings.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private router: Router,
    private settingsService: SettingsService) { }

  private navigateTo(route: string, successMessage?: string, errorMessage?: string) {
    this.router.navigate([route]).then(success => {
      this.logSuccess(successMessage || `Navigated to ${route}`);
    }).catch(err => {
      this.logError(errorMessage || `Navigation to ${route} failed`, err);
    });
  }

  private logSuccess(message: string) {
    if (this.settingsService.showDebugLogs) {
      toastr.success(message);
    }
    console.log(message);
  }

  private logError(message: string, error?: any) {
    if (this.settingsService.showDebugLogs) {
      toastr.error(message);
    }
    console.error(message, error);
  }


  // NAVIGATION FUNCTIONS..
  navigateToDashboard() {
    this.navigateTo('/dashboard', 'Navigated to dashboard.', 'Navigation to dashboard failed.');
  }

  navigateToLogin() {
    this.navigateTo('/login', 'Navigated to login page.', 'Navigation to login failed.');
  }

  navigateToRegisterUser() {
    this.navigateTo('/register', 'Navigated to registration page.', 'Navigation to register failed.');
  }

  navigateToSettings() {
    this.navigateTo('/settings', 'Navigated to settings page.', 'Navigation to settings failed.');
  }

  navigateToChatRoom(roomId: number | string) {

    this.navigateTo(`/chat/${roomId}`, `Navigated to chat room ID: ${roomId}`, 'Navigation to chat room failed.');
  }

  navigateToAdminPanel() {
    this.navigateTo('/admin', 'Navigated to admin panel.', 'Navigation to admin panel failed.');
  }

  navigateToVideoChat(roomId: string) {
    this.navigateTo(`/video-chat/${roomId}`, `Navigated to video chat for room ID: ${roomId}`, 'Navigation to video chat failed.');
  }



}
