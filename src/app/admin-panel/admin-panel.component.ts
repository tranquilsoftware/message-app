import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, User, Group, ChatRoom } from '../services/authentication.service';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, forkJoin, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NavigationService } from '../services/navigation.service';
import { ChatService } from '../services/chat.service';
import { GroupService } from '../services/group.service';
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

  // accept/reject user join requests
  pendingRequests: any[] = [];

  // make new user form
  showingAddUserForm = false;
  newUser: any = {};
  showingGroupAdminForm: boolean = false;
  selectedUser: User | null = null;
  groupIdOrName: string = '';


  constructor(
    private authService: AuthenticationService,
    private http: HttpClient,
    private groupService: GroupService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadPendingRequests();
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

        // Load pending requests for both super admins and group admins
        if (this.isSuperAdmin || this.isGroupAdmin) {
          console.log('Loading pending requests...');
          this.loadPendingRequests();
        }

      },
      error: (error) => {
        console.error('Error checking user role', error);
        toastr.error('Failed to load user information. Please try again.');
        this.navigationService.navigateToDashboard();
      }
    });
  }


  // Group Admin Requests And Approval
  loadPendingRequests() {
    console.log('AdminPanelComponent: Starting to load pending requests');
    console.log('isSuperAdmin:', this.isSuperAdmin, 'isGroupAdmin:', this.isGroupAdmin);
    if (this.isSuperAdmin || this.isGroupAdmin) {
      console.log('AdminPanelComponent: User is authorized to view pending requests');
      this.groupService.getPendingRequests().subscribe(
        requests => {
          this.pendingRequests = requests.flatMap(group => 
            group.pendingRequests.map((user: User) => ({
              groupId: group.groupId,
              groupName: group.name,
              userId: user._id,
              username: user.username,
              email: user.email,
              profile_pic: user.profile_pic || './img/default_user.png'
            }))
          );
          console.log('AdminPanelComponent: Pending requests loaded:', this.pendingRequests);
        },
        error => {
          console.error('AdminPanelComponent: Error loading pending requests', error);
          if (error.status === 404) {
            console.error('AdminPanelComponent: 404 error - Route not found');
          }
          toastr.error('Failed to load pending join requests. Please try again.');
        }
      );
    } else {
      console.log('AdminPanelComponent: User is NOT authorized to view pending requests');
    }
  }

  approveRequest(request: any) {
    this.groupService.approveJoinRequest(request.groupId, request.userId).subscribe(
      () => {
        this.loadPendingRequests();
        toastr.success('Request approved successfully');
      },
      error => {
        console.error('Error approving request', error);
        toastr.error('Failed to approve request. Please try again.');
      }
    );
  }

  rejectRequest(request: any) {
    this.groupService.rejectJoinRequest(request.groupId, request.userId).subscribe(
      () => {
        this.loadPendingRequests();
        toastr.success('Request rejected successfully');
      },
      error => {
        console.error('Error rejecting request', error);
        toastr.error('Failed to reject request. Please try again.');
      }
    );
  }

  loadAllGroups() {
    this.http.get<Group[]>(`${this.apiUrl}/groups/`)
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

    // Scroll down to users section
    setTimeout(() => {
      const groupListElement = document.querySelector('.user-list');
      if (groupListElement) {
        groupListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  }

  showGroups() {
    this.showingGroups = true;
    this.showingUsers = false;


    // Scroll down to groups section
    setTimeout(() => {
      const groupListElement = document.querySelector('.group-list');
      if (groupListElement) {
        groupListElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);

  }

  editGroup(group: Group) {
    this.selectedGroup = { ...group };
    this.selectedChatroom = null;
    this.loadGroupChatrooms(group.groupId);

    // Scroll down to the group edit panel
    setTimeout(() => {
      const bottomComponent = document.querySelector('.admin-panel > *:last-child');
      if (bottomComponent) {
        bottomComponent.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
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


  // make the empty group form, (for the user to fill out)
  addGroup() {
    this.selectedGroup = {
      _id: '',
      groupId: '',
      name: '',
      chatrooms: [],
      members: [],
      admins: [],
      pendingRequests: [],
      isExpanded: false
    };
    this.selectedChatroom = null;
  }

  // show dialog (are you sure you want to delete this group?)
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
  
  // post to server to make a new group or update an existing group
  updateGroup() {
    if (this.selectedGroup) {
      const isNewGroup = !this.selectedGroup.groupId;
      const url = `${this.apiUrl}/groups/${this.selectedGroup.groupId}`;
      const method = isNewGroup ? 'post' : 'put'; // either create or update a group
  
      // Prepare the group data
      const groupData = {
        name: this.selectedGroup.name,
        admins: this.selectedGroup.admins,
        members: this.selectedGroup.members,
        pendingRequests: this.selectedGroup.pendingRequests,
        chatrooms: this.selectedGroup.chatrooms.map(chatroom => chatroom._id)
      };
  
      this.http.request<Group>(method, url, { body: groupData })
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
            toastr.success(`Successfully ${isNewGroup ? 'added' : 'updated'} group: ${updatedGroup.name}`);
            this.selectedGroup = null;
          },
          error: (error) => {
            console.error(`Failed to ${isNewGroup ? 'add' : 'update'} group`, error);
            toastr.error(`Failed to ${isNewGroup ? 'add' : 'update'} group. Please try again.`);
          }
        });
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
              console.log('Chatroom created successfully!:', updatedChatroom);
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

  promoteToGroupAdmin(user: User, groupIdOrName: string) {
    this.postWithAuth<User>(`users/${user._id}/promote-group-admin`, { groupIdOrName }).subscribe(
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
        if (!user.adminInGroups.includes(groupIdOrName)) {
          user.adminInGroups.push(groupIdOrName);
        }
        toastr.success(`${user.username} promoted to Group Admin for group ${groupIdOrName}`);
      },
      (error) => {
        console.error('Error promoting user to Group Admin:', error);
        toastr.error('Failed to promote user to Group Admin');
      }
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
        toastr.success(`User ${newUser.username} created successfully`);
      },
      (error) => {
        console.error('Error creating user:', error);
        toastr.error('Failed to create user. Please try again.');
      }
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

  // Add New User
  showAddUserForm() {
    this.showingAddUserForm = true;
    this.newUser = {};
  }

  cancelAddUser() {
    this.showingAddUserForm = false;
    this.newUser = {};
  }

  addUser() {
    if (this.newUser.username && this.newUser.email && this.newUser.password) {
      this.createUser(this.newUser);
      this.showingAddUserForm = false;
      this.newUser = {};
    } else {
      toastr.error('Please fill in all required fields', 'Validation Error');
    }
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

  showPromoteToGroupAdminForm(user: User) {
    this.showingGroupAdminForm = true;
    this.selectedUser = user;
    this.groupIdOrName = '';
    // Scroll to the form
    setTimeout(() => {
      const formElement = document.querySelector('.group-admin-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  confirmPromoteToGroupAdmin(user: User) {
    if (this.groupIdOrName) {
      this.promoteToGroupAdmin(user, this.groupIdOrName);
      this.cancelPromoteToGroupAdmin();
    } else {
      toastr.error('Please enter a Group ID or Name');
    }
  }

  cancelPromoteToGroupAdmin() {
    this.showingGroupAdminForm = false;
    this.selectedUser = null;
    this.groupIdOrName = '';
  }

  createNewGroup() {
    const newGroup: Partial<Group> = {
      name: 'New Group',
      chatrooms: [],
      members: [],
      admins: [],
      pendingRequests: []
    };

    this.groupService.createGroup(newGroup).subscribe({
      next: (createdGroup: Group) => {
        this.groups.push(createdGroup);
        this.selectedGroup = createdGroup;
        console.log('Group created successfully:', createdGroup);
        toastr.success('Group created successfully');
      },
      error: (error) => {
        console.error('Failed to create group', error);
        toastr.error('Failed to create group. Please try again.');
      }
    });
  }


}
