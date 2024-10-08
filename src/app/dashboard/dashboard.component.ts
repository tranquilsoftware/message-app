import {Component, OnDestroy, OnInit} from '@angular/core';
import {CommonModule, NgFor, NgIf} from '@angular/common';
import {AuthenticationService, ChatRoom, Group} from "../services/authentication.service";
import {Observable, Subscription} from "rxjs";
import {tap} from "rxjs/operators";
import {NavigationService} from "../services/navigation.service";
import {HttpClient} from "@angular/common/http";
import { GroupService } from "../services/group.service";
import * as toastr from "toastr";
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, NgFor, NgIf],
  styleUrls: ['./dashboard.component.css'],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit, OnDestroy {
  groups: any[] = []; // Group list. POPULATED BYSERVER ON SUCCESSFUL GET REQUEST>:)
  chatrooms: ChatRoom[] = [];

  // for showing the request to join group button
  isSuperAdmin: boolean = false;

  // get authenticated
  isAuthenticated$: Observable<boolean>;
  private authSubscription: Subscription | undefined;


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

        }

        return isAuthenticated;
      })
    ).subscribe();

    this.checkUserRole();
  }

  ngOnDestroy(): void {
    // Safely unsubscribe.
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  checkUserRole() {
    this.authenticationService.hasRole('super').subscribe(isSuperAdmin => {
      this.isSuperAdmin = isSuperAdmin;
    });
  }

  requestToJoinGroup() {
    const groupId = prompt('Enter the Group ID or name you want to join:');
    if (groupId) {
      this.groupService.requestToJoinGroup(groupId).subscribe(
        () => {
          toastr.success('Request sent successfully');
        },
        error => {
          console.error('Error sending request:', error);
          toastr.error('Failed to send request');
        }
      );
    }
  }

  loadGroups() {
    // GET request to mongodb: mydb/groups

    //grabs the groups that the user is a member of
    // if the url is /api/groups/ itll populate all groups..
    this.http.get<Group[]>('http://localhost:5000/api/groups/user-groups', {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).subscribe(
      (groups): void => {
        this.groups = groups.map(group => ({
          ...group,
          chatRooms: [],
          isExpanded: false
        }));
        console.log('User groups loaded:', this.groups);
      },
      (error) => {
        console.error('Failed to load user groups', error);
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





