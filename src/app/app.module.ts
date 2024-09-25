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
import {HTTP_INTERCEPTORS} from "@angular/common/http";
import {AuthInterceptor} from "./services/auth.interceptor";

import { SocketIoModule, SocketIoConfig } from "ngx-socket-io";
import {SocketService} from "./services/socket.service";
import { VideoChatComponent } from './video-chat/video-chat.component';

const config: SocketIoConfig = {
  url: 'http://localhost:5000',
  options: {
    autoConnect: true
  }
};

// Import other components as needed

@NgModule({
  declarations: [    

  ],
  imports: [
    AppComponent,
    BrowserModule,
    RouterModule.forRoot(routes),  AppRoutingModule, // setup routing..
    LoginComponent,
    VideoChatComponent,
    DashboardComponent,
    SettingsComponent,
    ChatRoomComponent,
    AdminPanelComponent,
    SocketIoModule.forRoot(config) // setup socket
  ],

  providers: [
    SocketService,
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true }
  ],
  bootstrap: []
})
export class AppModule { }
