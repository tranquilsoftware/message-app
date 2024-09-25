import {Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private renderer: Renderer2;
  private darkModeSubject = new BehaviorSubject<boolean>(false);

  /**
   * Note that we rely on the localStorage key 'dark_mode'.
   * So, login screen and register screen will not have dark mode features. (once refreshed).
   */

  constructor(rendererFactory: RendererFactory2) {
    // Declare renderer
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadSavedMode();
  }

  toggleDarkMode(): void {
    const newDarkMode = !this.darkModeSubject.value;
    this.darkModeSubject.next(newDarkMode);
    this.applyDarkMode(newDarkMode);
    localStorage.setItem('dark_mode', JSON.stringify(newDarkMode));

  }

  getDarkMode(): boolean {
    return this.darkModeSubject.value;
  }

  getDarkModeObservable() {
    return this.darkModeSubject.asObservable();
  }

  private applyDarkMode(isDarkMode: boolean): void {
    const body = document.body;

    if (isDarkMode) {
      this.renderer.addClass(body, 'dark-mode');
    } else {
      this.renderer.removeClass(body, 'dark-mode');
    }

    localStorage.setItem('dark_mode', JSON.stringify(this.darkModeSubject.value));
    this.darkModeSubject.next(isDarkMode);

    console.log('Dark mode: ', localStorage.getItem('dark_mode'))
  }

  public loadSavedMode(): void {
    const saved_mode = localStorage.getItem('dark_mode');
    if (saved_mode !== null) {
      // Grab value from local storage
      this.darkModeSubject.next (JSON.parse(saved_mode));

      // Literally apply the dark mode theme...
      this.applyDarkMode(this.darkModeSubject.value);
    }
  }

}
