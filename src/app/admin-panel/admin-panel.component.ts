import { Component, OnInit } from '@angular/core';
import { AuthenticationService, User, Group, ChatRoom } from '../services/authentication.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-panel',
  template: `
    <div *ngIf="isSuper">
      <h2>Super Admin Panel</h2>
      <button (click)="showUsers()">Manage Users</button>
      <button (click)="showGroups()">Manage Groups</button>
      <div *ngIf="showingUsers">
        <h3>Users</h3>
        <ul>
          <li *ngFor="let user of users">
            {{ user.username }} - {{ user.email }}
            <button (click)="promoteToGroupAdmin(user)">Promote to Group Admin</button>
            <button (click)="promoteToSuperAdmin(user)">Promote to Super Admin</button>
            <button (click)="removeUser(user)">Remove User</button>
          </li>
        </ul>
      </div>
      <div *ngIf="showingGroups">
        <h3>Groups</h3>
        <ul>
          <li *ngFor="let group of groups">
            {{ group.name }}
            <button (click)="removeGroup(group)">Remove Group</button>
          </li>
        </ul>
      </div>
    </div>
    <div *ngIf="isGroupAdmin">
      <h2>Group Admin Panel</h2>
      <button (click)="createGroup()">Create Group</button>
      <div *ngFor="let group of adminGroups">
        <h3>{{ group.name }}</h3>
        <button (click)="createChatRoom(group)">Create Chat Room</button>
        <button (click)="removeGroup(group)">Remove Group</button>
        <h4>Chat Rooms</h4>
        <ul>
          <li *ngFor="let chatRoom of group.chat_rooms">
            {{ chatRoom.name }}
            <button (click)="removeChatRoom(group, chatRoom)">Remove Chat Room</button>
          </li>
        </ul>
        <h4>Users</h4>
        <ul>
          <li *ngFor="let user of groupUsers[group._id]">
            {{ user.username }}
            <button (click)="removeUserFromGroup(user, group)">Remove from Group</button>
            <button (click)="banUser(user, group)">Ban User</button>
          </li>
        </ul>
      </div>
    </div>
  `
})
export class AdminPanelComponent implements OnInit {
  isSuper = false;
  isGroupAdmin = false;
  users: User[] = [];
  groups: Group[] = [];
  adminGroups: Group[] = [];
  groupUsers: { [groupId: string]: User[] } = {};
  showingUsers = false;
  showingGroups = false;

  constructor(
    private authService: AuthenticationService,
    private http: HttpClient
  ) {}

  ngOnInit() {
    this.checkUserRole();
    this.loadUsers();
    this.loadGroups();
  }

  checkUserRole() {
    this.authService.getCurrentUser().subscribe(
      (user: User | null) => {
        if (user) {
          // Assume 'roles' is a property of User. If not, you'll need to add it.
          this.isSuper = user.roles?.includes('super') || false;
          this.isGroupAdmin = user.roles?.includes('groupAdmin') || false;
          if (this.isGroupAdmin) {
            this.loadAdminGroups(user._id);
          }
        }
      },
      (error) => console.error('Error fetching current user:', error)
    );
  }

  loadUsers() {
    this.getWithAuth<User[]>('users').subscribe(
      (users) => this.users = users,
      (error) => console.error('Error loading users:', error)
    );
  }

  loadGroups() {
    this.getWithAuth<Group[]>('groups').subscribe(
      (groups) => this.groups = groups,
      (error) => console.error('Error loading groups:', error)
    );
  }

  loadAdminGroups(userId: string) {
    this.getWithAuth<Group[]>(`users/${userId}/admin-groups`).subscribe(
      (groups) => {
        this.adminGroups = groups;
        groups.forEach(group => this.loadGroupUsers(group._id));
      },
      (error) => console.error('Error loading admin groups:', error)
    );
  }

  loadGroupUsers(groupId: string) {
    this.getWithAuth<User[]>(`groups/${groupId}/users`).subscribe(
      (users) => this.groupUsers[groupId] = users,
      (error) => console.error(`Error loading users for group ${groupId}:`, error)
    );
  }

  showUsers() {
    this.showingUsers = true;
    this.showingGroups = false;
  }

  showGroups() {
    this.showingGroups = true;
    this.showingUsers = false;
  }

  promoteToGroupAdmin(user: User) {
    this.postWithAuth(`users/${user._id}/promote-group-admin`, {}).subscribe(
      () => {
        if (user.roles) {
          user.roles.push('groupAdmin');
        } else {
          user.roles = ['groupAdmin'];
        }
        console.log(`${user.username} promoted to Group Admin`);
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

  removeGroup(group: Group) {
    this.deleteWithAuth(`groups/${group._id}`).subscribe(
      () => {
        this.groups = this.groups.filter(g => g._id !== group._id);
        this.adminGroups = this.adminGroups.filter(g => g._id !== group._id);
        console.log(`Group ${group.name} removed`);
      },
      (error) => console.error('Error removing group:', error)
    );
  }

  createGroup() {
    const groupName = prompt('Enter group name:');
    if (groupName) {
      this.postWithAuth<Group>('groups', { name: groupName }).subscribe(
        (newGroup) => {
          this.adminGroups.push(newGroup);
          console.log(`Group ${newGroup.name} created`);
        },
        (error) => console.error('Error creating group:', error)
      );
    }
  }

  createChatRoom(group: Group) {
    const chatRoomName = prompt('Enter chat room name:');
    if (chatRoomName) {
      this.postWithAuth<ChatRoom>(`groups/${group._id}/chat-rooms`, { name: chatRoomName }).subscribe(
        (newChatRoom) => {
          if (!group.chat_rooms) {
            group.chat_rooms = [];
          }
          group.chat_rooms.push(newChatRoom);
          console.log(`Chat room ${newChatRoom.name} created in group ${group.name}`);
        },
        (error) => console.error('Error creating chat room:', error)
      );
    }
  }

  removeChatRoom(group: Group, chatRoom: ChatRoom) {
    this.deleteWithAuth(`groups/${group._id}/chat-rooms/${chatRoom._id}`).subscribe(
      () => {
        if (group.chat_rooms && Array.isArray(group.chat_rooms)) {
          group.chat_rooms = group.chat_rooms.filter((c: ChatRoom) => c._id !== chatRoom._id);
          console.log(`Chat room ${chatRoom.name} removed from group ${group.name}`);
        } else {
          group.chat_rooms = [];
        }
      },
      (error) => console.error('Error removing chat room:', error)
    );
  }

  removeUserFromGroup(user: User, group: Group) {
    this.deleteWithAuth(`groups/${group._id}/users/${user._id}`).subscribe(
      () => {
        this.groupUsers[group._id] = this.groupUsers[group._id].filter(u => u._id !== user._id);
        console.log(`${user.username} removed from group ${group.name}`);
      },
      (error) => console.error('Error removing user from group:', error)
    );
  }

  banUser(user: User, group: Group) {
    this.postWithAuth(`groups/${group._id}/ban/${user._id}`, {}).subscribe(
      () => {
        this.groupUsers[group._id] = this.groupUsers[group._id].filter(u => u._id !== user._id);
        console.log(`${user.username} banned from group ${group.name}`);
      },
      (error) => console.error('Error banning user:', error)
    );
  }

  private getWithAuth<T>(url: string): Observable<T> {
    return this.http.get<T>(this.authService.apiUrl + url, this.getHttpOptions());
  }

  private postWithAuth<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(this.authService.apiUrl + url, body, this.getHttpOptions());
  }

  private deleteWithAuth<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.authService.apiUrl + url, this.getHttpOptions());
  }

  private getHttpOptions() {
    const token = this.authService.getToken();
    return {
      headers: new HttpHeaders().set('Authorization', `Bearer ${token}`)
    };
  }
}
