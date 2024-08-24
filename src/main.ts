import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {routes} from "./app/app.routes";
import {provideRouter} from "@angular/router";
import {provideHttpClient} from "@angular/common/http";

const appConfig = {
  providers: [
    provideRouter(routes), // ROUTING CONFIG ATTACHED.
    provideHttpClient() // IMPORTANT TO RUN
  ],
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));

// platformBrowserDynamic().bootstrapModule(AppModule)
//   .catch(err => console.error(err));
