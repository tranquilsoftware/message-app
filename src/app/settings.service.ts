import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  // Global variables..
  public showDebugLogs: boolean = false; // Show debug logs in console (if its working, don't need I suppose)
  public showTimestampOnMessages : boolean = false; // Display when the user sent the message! uses showTimestamp(..) func

  constructor() { }
}
