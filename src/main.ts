import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import {routes} from "./app/app.routes";
import {provideRouter} from "@angular/router";

const appConfig = {
  providers: [
    provideRouter(routes), // ROUTING CONFIG ATTACHED.
  ],
};

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
