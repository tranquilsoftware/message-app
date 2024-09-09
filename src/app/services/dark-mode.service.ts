import {Injectable, Renderer2, RendererFactory2} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class DarkModeService {
  private renderer: Renderer2;
  private dark_mode= new BehaviorSubject<boolean>(true);

  constructor(rendererFactory: RendererFactory2) {
    // Declare renderer
    this.renderer = rendererFactory.createRenderer(null, null);
    this.loadSavedMode();
  }

  toggleDarkMode(): void {
    this.dark_mode.next(!this.dark_mode.value); // toggle boolean
    this.updateDarkMode()
  }

  getDarkMode(): boolean {
    return this.dark_mode.value;
  }

  getDarkModeObservable() {
    return this.dark_mode.asObservable();
  }

  private updateDarkMode(): void {
    const body = document.body;

    if (this.dark_mode.value) {
      this.renderer.addClass(body, 'dark-mode');
    } else {
      this.renderer.removeClass(body, 'dark-mode');
    }

    localStorage.setItem('dark_mode', JSON.stringify(this.dark_mode.value));
    console.log('Dark mode: ', localStorage.getItem('dark_mode'))
  }

  private loadSavedMode(): void {
    const saved_mode = localStorage.getItem('dark_mode');
    if (saved_mode !== null) {
      this.dark_mode.next (JSON.parse(saved_mode));
      this.updateDarkMode()
    }
  }

}
