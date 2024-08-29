import { Component, OnInit, OnDestroy } from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {Router} from "@angular/router";
import * as toastr from "toastr";
import { AuthenticationService } from "../services/authentication.service";
import {Observable } from "rxjs";
import {map} from "rxjs/operators";
import { SettingsComponent } from '../settings/settings.component'
import {NavigationService} from "../services/navigation.service";

// interface Message { // Structure for a message
//   chat_id:      number;  // Chat-room ID
//   name:         string;  // Name of person
//   avatar:       string;  // String URL to the profile pic
//   last_msg:     string;  // The string of the users last sent msg
//   time:         string;  // Time of last sent msg
//
//   unread?:      number;  // Number of unread messages...
//   online?:      boolean; // Display green/red circle, indicating if person is online.. (socket.io later?)
// }



//   templateUrl: './dashboard.component.html',
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  styleUrls: ['./dashboard.component.css'],
  template: `
<!--    <ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">-->
<!--      <div class="dashboard-container">-->
<!--        <div class="dashboard-content">-->
<!--          <header>-->
<!--            <h1>Messages</h1>-->
<!--          </header>-->

<!--          <ul class="message-list">-->
<!--            <li *ngFor="let message of messages" (click)="openChat(message.chat_id)" class="message-item">-->
<!--              <div class="avatar-container">-->
<!--                <img [src]="message.avatar" [alt]="message.name" class="avatar">-->
<!--                <span *ngIf="message.online" class="online-indicator"></span>-->
<!--              </div>-->
<!--              <div class="message-content">-->
<!--                <h3>{{ message.name }}</h3>-->
<!--                <p>{{ message.last_msg }}</p>-->
<!--              </div>-->
<!--              <div class="message-meta">-->
<!--                <span *ngIf="message.unread" class="unread-badge">{{ message.unread }}</span>-->
<!--              </div>-->
<!--            </li>-->
<!--          </ul>-->
<!--        </div>-->

<!--        <nav class="bottom-nav">-->
<!--          <button class="active">Messages</button>-->
<!--          <button (click)="goToSettings()">Settings</button>-->
<!--          <button (click)="authenticationService.logout()">Logout</button>-->
<!--        </nav>-->
<!--      </div>-->
<!--    </ng-container>-->

<ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">
  <div class="dashboard-container">
    <header>
      <h1>Chat Rooms</h1>
    </header>

    <ul  class="message-list">
      <li *ngFor="let room of chatRooms" (click)="openChat(room._id)" class="message-item">
        {{ room.name }}
      </li>
    </ul>

    <nav class="bottom-nav">
      <button class="active">Messages</button>
      <button (click)="goToSettings()">Settings</button>
      <button (click)="authenticationService.logout()">Logout</button>
    </nav>

  </div>


</ng-container>

    <ng-template #notAuthenticated>
      <div class="not-authenticated">
        <h2>You are not logged in! (Or something went wrong with authentication)</h2>
        <p>Please logout and try to login again!</p>
        <button (click)="authenticationService.logout()">Logout</button>
      </div>
    </ng-template>
  `
})
export class DashboardComponent implements OnInit {
  // messages: Message[] = [];  // Init array
  chatRooms: any[] = [];
  isAuthenticated$: Observable<boolean> = new Observable<boolean>();
  constructor(private navigationService: NavigationService, public authenticationService: AuthenticationService) {

  }

  ngOnInit(): void {
    this.isAuthenticated$ = this.authenticationService.isAuthenticated().pipe(
      map(isAuthenticated => {

        // Is logged in logic... We pipe it to avoid any memory leaks (for production)
        if (isAuthenticated) {
          this.loadMessages();
        }

      return isAuthenticated;
    })
    )



    this.loadMessages();
  }

  // initializeDashboard() {
  //   console.log('Initializing dashboard');
  // }


  openChat(roomId: number): void {
    // Go to /chat-[id number]

    this.navigationService.navigateToChatRoom(roomId)
    console.log(`Opening chat for message ID: ${roomId}`);
  }

  loadMessages() {
    // TODO IMPLEMENT AS MONGODB REQUEST/POST SERVICE ETC.


    this.chatRooms = [
      { _id: '1', name: 'General Chat' },
      { _id: '2', name: 'Random' },
    ];

    // HARD CODE FOR FIRST TIME,
    // this.messages = [
    //   {
    //     chat_id: 1,
    //     name: 'Jeff',
    //     avatar: '../../img/i.jpg',
    //     last_msg: 'Hello World',
    //     time: '5 min',
    //     unread: 5,
    //     online: true
    //   },
    //   {
    //     chat_id: 2,
    //     name: 'Charlie',
    //     avatar: '../../img/i.jpg',
    //     last_msg: "hello",
    //     time: '15 min',
    //     unread: 0,
    //     online: false
    //   },

    // ];
  }

  goToSettings(): void {
    this.navigationService.navigateToSettings();
  }

}
