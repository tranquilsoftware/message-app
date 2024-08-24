// app.module.ts or similar
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouterModule } from '@angular/router';
import { AppRoutingModule, routes } from './app.routes'; // Import routes

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import {SettingsComponent} from "./settings/settings.component";
import {AdminPanelComponent} from "./admin-panel/admin-panel.component";
import {ChatRoomComponent} from "./chat-room/chat-room.component";
// Import other components as needed

@NgModule({
  declarations: [],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes),
    AppComponent,
    LoginComponent,
    DashboardComponent,
    SettingsComponent,
    AdminPanelComponent,
    ChatRoomComponent,
  ],

  providers: [],
  bootstrap: []
})
export class AppModule { }
