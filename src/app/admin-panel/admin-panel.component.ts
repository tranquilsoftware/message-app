import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, User, Group, ChatRoom } from '../services/authentication.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NavigationService } from '../services/navigation.service';
import { ChatService } from '../services/chat.service';
import * as toastr from "toastr";
import { Router } from '@angular/router';
import { HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [NavigationService, ChatService],
  styleUrls: ['./admin-panel.component.css'],
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  groups: Group[] = [];
  selectedGroup: Group | null = null;
  selectedChatroom: ChatRoom | null = null;
  private apiUrl = 'http://localhost:5000/api';

  isSuperAdmin: boolean = false;
  isGroupAdmin: boolean = false;
  adminGroups: Group[] = []; // ONLY FOR NORMAL USERS - SHOW THE GROUPS THEY ARE ADMIN OF.
  showingUsers: boolean = false;
  showingGroups: boolean = false;
  users: User[] = [];

  constructor(
    private authService: AuthenticationService,
    private http: HttpClient,
    private chatService: ChatService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.checkUserRole();
  }

  checkUserRole() {
    forkJoin({
      isSuperAdmin: this.authService.hasRole('super'),
      isGroupAdmin: this.authService.hasRole('groupAdmin'),
      adminGroups: this.authService.getAdminGroups()
    }).subscribe({
      next: ({ isSuperAdmin, isGroupAdmin, adminGroups }) => {
        this.isSuperAdmin = isSuperAdmin;
        this.isGroupAdmin = isGroupAdmin;
        if (this.isSuperAdmin) {
          this.loadAllGroups();
          this.loadAllUsers();
        } else if (this.isGroupAdmin) {
          this.loadAdminGroups(adminGroups);
        } else {
          this.navigationService.navigateToDashboard();
        }
      },
      error: (error) => {
        console.error('Error checking user role', error);
        toastr.error('Failed to load user information. Please try again.');
        this.navigationService.navigateToDashboard();
      }
    });
  }

  loadAllGroups() {
    this.http.get<Group[]>(`${this.apiUrl}/groups`)
      .pipe(catchError(this.handleError))
      .subscribe({
        next: (groups) => {
          this.groups = groups;
        },
        error: (error) => {
          console.error('Failed to load groups', error);
          toastr.error('Failed to load groups. Please try again.');
        }
      });
  }

  loadAllUsers() {
    this.getWithAuth<User[]>('users').subscribe(
      (users) => {
        this.users = users;
      },
      (error) => {
        console.error('Error loading users:', error);
      }
    );
  }

  loadAdminGroups(adminGroupIds: string[]) {
    this.http.get<Group[]>(`${this.apiUrl}/groups`)
      .pipe(
        map(groups => groups.filter(group => adminGroupIds.includes(group.groupId))),
        catchError(this.handleError)
      )
      .subscribe({
        next: (groups) => {
          this.adminGroups = groups;
        },
        error: (error) => {
          console.error('Failed to load admin groups', error);
          toastr.error('Failed to load your admin groups. Please try again.');
        }
      });
  }

  showUsers() {
    this.showingUsers = true;
    this.showingGroups = false;
  }

  showGroups() {
    this.showingGroups = true;
    this.showingUsers = false;
  }

  editGroup(group: Group) {
    this.selectedGroup = { ...group };
    this.selectedChatroom = null;
    this.loadGroupChatrooms(group.groupId);

    // scroll down
    setTimeout(() => window.scrollTo(0, document.body.scrollHeight), 100);
  }


  // /api/chatrooms/group/:groupId
  loadGroupChatrooms(groupId: string) {
    this.http.get<ChatRoom[]>(`${this.apiUrl}/chatrooms/group/${groupId}`)
    .pipe(catchError(this.handleError))
      .subscribe({
        next: (chatrooms) => {
          this.selectedGroup!.chatrooms = chatrooms;
        },
        error: (error) => {
          console.error('Failed to load chatrooms', error);
          toastr.error('Failed to load chatrooms. Please try again.');
        }
      });
  }

  addGroup() {
    this.selectedGroup = {
      _id: '',
      groupId: '',
      name: '',
      chatrooms: [],
      isExpanded: false
    };
    this.selectedChatroom = null;
  }

  removeGroup(group: Group) {
    if (confirm(`Are you sure you want to remove the group "${group.name}"?`)) {
      this.http.delete(`${this.apiUrl}/groups/${group.groupId}`)
        .pipe(catchError(this.handleError))
        .subscribe(
          () => {
            this.groups = this.groups.filter(g => g.groupId !== group.groupId);
            toastr.success(`Successfully removed group: ${group.name}`);
          },
          (error) => {
            console.error('Failed to remove group', error);
            toastr.error('Failed to remove group. Please try again.');
          }
        );
    }
  }

  updateGroup() {
    if (this.selectedGroup) {
      const isNewGroup = !this.selectedGroup.groupId;
      const url = isNewGroup ? `${this.apiUrl}/groups` : `${this.apiUrl}/groups/${this.selectedGroup.groupId}`;
      const method = isNewGroup ? 'post' : 'put';

      this.http.request<Group>(method, url, { body: this.selectedGroup })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (updatedGroup: Group) => {
            if (isNewGroup) {
              this.groups.push(updatedGroup);
            } else {
              const index = this.groups.findIndex(g => g.groupId === updatedGroup.groupId);
              if (index !== -1) {
                this.groups[index] = updatedGroup;
              }
            }
            this.selectedGroup = null;
            toastr.success(`Successfully ${isNewGroup ? 'added' : 'updated'} group: ${updatedGroup.name}`);
          },
          error: (error) => {
            console.error(`Failed to ${isNewGroup ? 'add' : 'update'} group`, error);
            toastr.error(`Failed to ${isNewGroup ? 'add' : 'update'} group. Please try again.`);
          }
        });
    } else {
      console.error('No group selected');
      toastr.error('Unable to update group: No group selected');
    }
  }

  cancelEdit() {
    this.selectedGroup = null;
  }

  addChatroom() {
    if (this.selectedGroup && this.selectedGroup.groupId) {
      this.selectedChatroom = {
        _id: '',
        groupId: this.selectedGroup.groupId,
        chatRoomName: '',
        chatRoomId: '',
        createdAt: new Date().toISOString()
      };
    } else {
      console.error('No group selected or group ID is missing');
      toastr.error('Please select a group before adding a chatroom');
    }
  }

  editChatroom(chatroom: ChatRoom) {
    this.selectedChatroom = { ...chatroom };
  }

  removeChatroom(chatroom: ChatRoom) {
    if (this.selectedGroup && confirm(`Are you sure you want to remove the chatroom "${chatroom.chatRoomName}"?`)) {
            this.http.delete(`${this.apiUrl}/groups/${this.selectedGroup.groupId}/chatrooms/${chatroom.chatRoomId}`)
        .pipe(catchError(this.handleError))
        .subscribe(
          () => {
            this.selectedGroup!.chatrooms = this.selectedGroup!.chatrooms.filter(c => c.chatRoomId !== chatroom.chatRoomId);
            toastr.success(`Successfully removed chatroom: ${chatroom.chatRoomName}`);
          },
          (error) => {
            console.error('Failed to remove chatroom', error);
            toastr.error('Failed to remove chatroom. Please try again.');
          }
        );
    }
  }

  updateChatroom() {
    if (this.selectedChatroom && this.selectedGroup && this.selectedGroup.groupId) {
      const isNewChatroom = !this.selectedChatroom.chatRoomId;
      const url = isNewChatroom
        ? `${this.apiUrl}/groups/${this.selectedGroup.groupId}/chatrooms`
        : `${this.apiUrl}/chatrooms/${this.selectedChatroom.chatRoomId}`;
      const method = isNewChatroom ? 'post' : 'put';

      this.http.request<ChatRoom>(method, url, { body: this.selectedChatroom })
        .pipe(catchError(this.handleError))
        .subscribe({
          next: (updatedChatroom: ChatRoom) => {
            if (isNewChatroom) {
              this.selectedGroup!.chatrooms.push(updatedChatroom);
            } else {
              const index = this.selectedGroup!.chatrooms.findIndex(c => c.chatRoomId === updatedChatroom.chatRoomId);
              if (index !== -1) {
                this.selectedGroup!.chatrooms[index] = updatedChatroom;
              }
            }
            this.selectedChatroom = null;
            toastr.success(`Successfully ${isNewChatroom ? 'added' : 'updated'} chatroom: ${updatedChatroom.chatRoomName}`);
          },
          error: (error) => {
            console.error(`Failed to ${isNewChatroom ? 'add' : 'update'} chatroom`, error);
            toastr.error(`Failed to ${isNewChatroom ? 'add' : 'update'} chatroom. Please try again.`);
          }
        });
    } else {
      console.error('Selected chatroom, group, or group ID is missing');
      toastr.error('Unable to update chatroom: Missing data');
    }
  }

  cancelChatroomEdit() {
    this.selectedChatroom = null;
  }

  promoteToGroupAdmin(user: User) {
    // Request user to type in groupId to be admin of
    const groupId = prompt('Enter the Group ID to promote this user as admin:');
    if (!groupId) return;

    this.postWithAuth<User>(`users/${user._id}/promote-group-admin/${groupId}`, {}).subscribe(
      (updatedUser: User) => {
        if (!user.roles) {
          user.roles = [];
        }
        if (!user.roles.includes('groupAdmin')) {
          user.roles.push('groupAdmin');
        }
        if (!user.adminInGroups) {
          user.adminInGroups = [];
        }
        if (!user.adminInGroups.includes(groupId)) {
          user.adminInGroups.push(groupId);
        }
        console.log(`${user.username} promoted to Group Admin for group ${groupId}`);
      },
      (error) => console.error('Error promoting user to Group Admin:', error)
    );
  }

  promoteToSuperAdmin(user: User) {
    this.postWithAuth(`users/${user._id}/promote-super-admin`, {}).subscribe(
      () => {
        if (user.roles) {
          user.roles.push('super');
        } else {
          user.roles = ['super'];
        }
        console.log(`${user.username} promoted to Super Admin`);
      },
      (error) => console.error('Error promoting user to Super Admin:', error)
    );
  }

  removeUser(user: User) {
    this.deleteWithAuth(`users/${user._id}`).subscribe(
      () => {
        this.users = this.users.filter(u => u._id !== user._id);
        console.log(`${user.username} removed`);
      },
      (error) => console.error('Error removing user:', error)
    );
  }


  // USER CREATE/EDIT FUNCTIONS ARE HERE, BUT NOT YET IMPLEMENTED - HERE FOR FUTURE USE
  createUser(user: User) {
    this.postWithAuth<User>('users', user).subscribe(
      (newUser) => {
        this.users.push(newUser);
      },
      (error) => console.error('Error creating user:', error)
    );
  }

  updateUser(user: User) {
    this.putWithAuth<User>(`users/${user._id}`, user).subscribe(
      (updatedUser) => {
        const index = this.users.findIndex(u => u._id === updatedUser._id);
        if (index !== -1) this.users[index] = updatedUser;
      },
      (error) => console.error('Error updating user:', error)
    );
  }

  // Handle Error logging etc

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  // Admin Panel Routing !

  private getWithAuth<T>(url: string): Observable<T> {
    return this.http.get<T>(this.authService.apiUrl + url, this.getHttpOptions());
  }

  private postWithAuth<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(this.authService.apiUrl + url, body, this.getHttpOptions());
  }

  private deleteWithAuth<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.authService.apiUrl + url, this.getHttpOptions());
  }

  private putWithAuth<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(this.authService.apiUrl + url, body, this.getHttpOptions());
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }
}
