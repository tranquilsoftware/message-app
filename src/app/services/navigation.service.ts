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

  private navigateTo(route: string, successMessage?: string) {
    this.router.navigate([route]).then(success => {
      this.logMessage(successMessage || `Navigated to ${route}`, 'success');
    }).catch(err => {
      this.logMessage(`Navigation to ${route} failed`, 'error', err);
    });
  }

  private logMessage(message: string, type: 'success' | 'error', error?: any) {
    if (this.settingsService.showDebugLogs) {
      type === 'success' ? toastr.success(message) : toastr.error(message);
    }
    type === 'success' ? console.log(message) : console.error(message, error);
  }

  // Navigation functions
  navigateToDashboard() {
    this.navigateTo('/dashboard', 'Navigated to dashboard.');
  }

  navigateToLogin() {
    this.navigateTo('/login', 'Navigated to login page.');
  }

  navigateToRegisterUser() {
    this.navigateTo('/register', 'Navigated to registration page.');
  }

  navigateToSettings() {
    this.navigateTo('/settings', 'Navigated to settings page.');
  }

  navigateToChatRoom(roomId: number | string) {

    this.navigateTo(`/chat/${roomId}`, `Navigated to chat room ID: ${roomId}`);
  }

  navigateToAdminPanel() {
    this.navigateTo('/admin', 'Navigated to admin panel.');
  }

  navigateToVideoChat(roomId: string) {
    this.navigateTo(`/video-chat/${roomId}`, `Navigated to video chat for room ID: ${roomId}`);
  }



}
