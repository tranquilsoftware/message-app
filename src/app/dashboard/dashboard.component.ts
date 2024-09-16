import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {AuthenticationService, ChatRoom, Group} from "../services/authentication.service";
import {Observable, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {NavigationService} from "../services/navigation.service";
import {HttpClient} from "@angular/common/http";
import { GroupService } from "../services/group.service";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  styleUrls: ['./dashboard.component.css'],
  template: `


    <ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">
      <div class="dashboard-container">
        <header>
          <h1>Groups & Channels</h1>
        </header>

        <!--         populate groups last message? surely needd.  -->
        <!--      Angular For group of every group to current user-->
        <ul class="group-list">

          <li *ngFor="let group of groups" class="group-item">

            <div class="group-header" (click)="toggleGroup(group)">
              <i class="fas"
                 [ngClass]="{'fa-chevron-right': !group.isExpanded, 'fa-chevron-down': group.isExpanded}"></i>
              {{ group.name }}
            </div>


            <ul *ngIf="group.isExpanded" class="channel-list">

              <li *ngFor="let chatRoom of group.chatRooms" class="channel-list" (click)="openChat(chatRoom.chatRoomId)">
                {{ chatRoom.chatRoomName }}
              </li>

              <!-- <li *ngFor="let i of temp_fake_chatrooms" class="channel-list" (click)="openChat(1337)">
                {{ 'HELLO WORLD' }}
              </li> -->

            </ul>

          </li>
        </ul>

        <nav class="bottom-nav">
          <button class="active">Dashboard</button>
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
export class DashboardComponent implements OnInit, OnDestroy {
  // groups: Group[] = []; // Group list. POPULATED BYSERVER ON SUCCESSFUL GET REQUEST>:)
  groups: any[] = []; // Group list. POPULATED BYSERVER ON SUCCESSFUL GET REQUEST>:)
  selectedGroup: Group | null = null;
  chatrooms: ChatRoom[] = [];

  chatRoomDetails: { [key: string]: ChatRoom } = {};

  // get authenticated
  isAuthenticated$: Observable<boolean>;
  private authSubscription: Subscription | undefined;

  temp_fake_chatrooms: number[] = new Array(3);

  constructor(
    private navigationService: NavigationService,
    public  groupService: GroupService,
    public  authenticationService: AuthenticationService,
    private http: HttpClient)
  {
    this.isAuthenticated$ = this.authenticationService.isAuthenticated();
  }

  ngOnInit(): void {
    // Before requesting data from MongoDB, authenticate user first.
    this.authSubscription = this.authenticationService.isAuthenticated().pipe(
      tap(isAuthenticated => {


        if (isAuthenticated) {
          this.loadGroups();
          // this.loadAndLogChatRooms();

        }

        return isAuthenticated;
      })
    ).subscribe();

  }

  ngOnDestroy(): void {
    // Safely unsubscribe.
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }


  loadAndLogChatRooms(): void {
    const chatroomUrl = 'http://localhost:5000/api/chatrooms';
    this.http.get<ChatRoom[]>(chatroomUrl).subscribe(
      (chatrooms): void => {
        console.log(`All Chatrooms (${chatroomUrl}) from MongoDB:`, JSON.stringify(chatrooms, null, 2));

        // this.groups.chatrooms = chatrooms;
      },
      (error) => {
        console.error('Failed to load chat rooms', error);
      }
    );
  }

  loadGroups() {
    // GET request to mongodb: mydb/groups

    this.http.get<Group[]>('http://localhost:5000/api/groups').subscribe(
      (groups): void => {
        this.groups = groups.map(group => ({
          ...group,
          chatRooms: [],
          isExpanded: false // Set false as default, so their items dont show automatically
        }));

        console.log('Groups loaded:', this.groups);
        // this.loadChatRoomsForGroups();

      },
      (error) => {
        console.error('Failed to load groups', error);
      }
    );
  }


  loadChatrooms(groupId: string) {
    console.log('Loading chatrooms for group:', groupId);



    this.groupService.loadChatrooms(groupId).subscribe(
      (chatRooms) => {
        const group = this.groups.find(g => g.groupId === groupId);
        if (group) {
          group.chatRooms = chatRooms;
          console.log('Chatrooms loaded for group:', groupId, group.chatRooms);
        } else {
          console.error('Group not found:', groupId);
        }
        console.log('Groups after populating chatrooms:', this.groups);
      },
      (error) => {
        console.error('Failed to load chat rooms', error);
      }
    );

  }


  goToSettings(): void {
    this.navigationService.navigateToSettings();
  }

  getChatRoomName(chatRoomId: string): string {
    return 'Loading...';
  }

  // Go to /chat-[id number]
  // Open Channel/Chatroom..
  openChat(roomId: number | string): void {
    this.navigationService.navigateToChatRoom(roomId)
  }


  // User clicked a Group Item on dashboard, lets expand its individual channels/chatrooms!
  toggleGroup(group: any) {
    console.log('Toggling group:', group);
    group.isExpanded = !group.isExpanded;

    if (group.isExpanded && (!group.chatRooms || group.chatRooms.length === 0)) {
      console.log('Loading chatrooms for group:', group.groupId);
      this.loadChatrooms(group.groupId);
    }
  }



}





