import { Component, OnInit, OnDestroy } from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {Router} from "@angular/router";
import * as toastr from "toastr";
import {AuthenticationService, Group} from "../services/authentication.service";
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
<!--    Old MessageApp individual users concept -->
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

<!--    </ng-container>-->

<ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">
  <div class="dashboard-container">
    <header>
      <h1>Groups & Channels</h1>
    </header>

    <ul  class="message-list">

<!--      Angular For group of every group to current user-->
      <li *ngFor="let group of groups"  class="message-item" >
        {{ group.name }}
        <ul>
          <li *ngFor="let chatRoom of group.chat_rooms" (click)="openChat(chatRoom._id)" >{{ chatRoom.name }}</li>
        </ul>
      </li>

    </ul>

    <nav class="bottom-nav">
      <button class="active">Groups</button>
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
  groups: Group[] = [];
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


    this.groups = [
      {
        _id: '100',
        name: 'All',
        chat_rooms: [
          { _id: 1, name: 'Fun Channel' },
          { _id: 2, name: 'General Channel' }
        ]
      },

      { _id: '102',
        name: 'IT Group',
        chat_rooms: [
          { _id: 20, name: 'Tech Channel' },
          { _id: 21, name: 'Software Channel' }
        ] },

      { _id: '103',
        name: 'School Group',
        chat_rooms: [
          { _id: 30, name: 'Schoolwork Channel' },
        ]
      },
    ];


  }

  goToSettings(): void {
    this.navigationService.navigateToSettings();
  }

}
