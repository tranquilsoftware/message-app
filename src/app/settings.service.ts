import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  // Global variables..
  public showDebugLogs: boolean = false;

  constructor() { }
}
