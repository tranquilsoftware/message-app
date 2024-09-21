import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthenticationService, User, Group, ChatRoom } from '../services/authentication.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NavigationService } from '../services/navigation.service';
import { ChatService } from '../services/chat.service';

@Component({
  selector: 'app-admin-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [NavigationService, ChatService],
  styleUrls: ['./admin-panel.component.css'],
  template: `
    <div class="admin-panel-container">
    <!-- <button class="back-button" (click)="showAdminPanel()">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
           stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15 18l-6-6 6-6"/>
      </svg>
      Back to Admin Panel
    </button> -->

      <div *ngIf="isSuper && showingAdminPanel" class="admin-section">
        <h2>Super Admin Panel</h2>
        <div class="button-group">
          <button class="admin-button" (click)="showUsers()">Manage Users</button>
          <button class="admin-button" (click)="showGroups()">Manage Groups</button>
        </div>
      </div>
      <div *ngIf="showingUsers" class="list-section">
        <h3>Users</h3>
        <ul>
          <li *ngFor="let user of users" class="list-item">
            <span>{{ user.username }} - {{ user.email }}</span>
            <div class="button-group">
              <button class="admin-button" (click)="promoteToGroupAdmin(user)">Promote to Group Admin</button>
              <button class="admin-button" (click)="promoteToSuperAdmin(user)">Promote to Super Admin</button>
              <button class="admin-button remove" (click)="removeUser(user)">Remove User</button>
            </div>
          </li>
        </ul>
      </div>
      <div *ngIf="showingGroups" class="list-section">
        <h3>Groups</h3>
        <button class="admin-button" (click)="createGroup()">Add Group</button>
        <ul>
          <li *ngFor="let group of groups" class="list-item">
            <span>{{ group.name }}</span>
            <div class="button-group">
              <button class="admin-button" (click)="editGroup(group)">Edit</button>
              <button class="admin-button remove" (click)="removeGroup(group)">Remove</button>
            </div>
          </li>
        </ul>
      </div>
      <div *ngIf="isGroupAdmin" class="admin-section">
        <h2>Group Admin Panel</h2>
        <button class="admin-button" (click)="createGroup()">Create Group</button>
        <div *ngFor="let group of adminGroups" class="group-section">
          <h3>{{ group.name }}</h3>
          <div class="button-group">
            <button class="admin-button" (click)="createChatRoom(group)">Create Chat Room</button>
            <button class="admin-button remove" (click)="removeGroup(group)">Remove Group</button>
          </div>
          <h4>Chat Rooms</h4>
          <ul>
            <li *ngFor="let chatRoom of group.chatrooms" class="list-item">
              <span>{{ chatRoom.chatRoomName }}</span>
              <div class="button-group">
                <button class="admin-button" (click)="editChatRoom(group, chatRoom)">Edit</button>
                <button class="admin-button remove" (click)="removeChatRoom(group, chatRoom)">Remove</button>
              </div>
            </li>
          </ul>
          <h4>Users</h4>
          <ul>
            <li *ngFor="let user of groupUsers[group._id]" class="list-item">
              <span>{{ user.username }}</span>
              <div class="button-group">
                <button class="admin-button" (click)="removeUserFromGroup(user, group)">Remove from Group</button>
                <button class="admin-button remove" (click)="banUser(user, group)">Ban User</button>
              </div>
            </li>
          </ul>
        </div>
      </div>
      <div *ngIf="showingChannels" class="list-section">
        <h3>Channels</h3>
        <button class="admin-button" (click)="openAddChannelModal()">Add Channel</button>
        <ul>
          <li *ngFor="let channel of channels" class="list-item">
            <span>{{ channel.chatRoomName }} (Group: {{ getGroupName(channel.groupId) }})</span>
            <div class="button-group">
              <button class="admin-button" (click)="editChannel(channel)">Edit</button>
              <button class="admin-button remove" (click)="removeChannel(channel)">Remove</button>
            </div>
          </li>
        </ul>
      </div>

      <div *ngIf="showAddChannelModal" class="modal">
        <div class="modal-content">
          <h3>Add New Channel</h3>
          <select [(ngModel)]="newChannel.groupId">
            <option value="">Select a group</option>
            <option *ngFor="let group of groups" [value]="group._id">{{ group.name }}</option>
          </select>
          <input [(ngModel)]="newChannel.name" placeholder="Channel name">
          <div class="button-group">
            <button class="admin-button" (click)="addChannel()">Add</button>
            <button class="admin-button remove" (click)="cancelAddChannel()">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  `,
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
  showingAdminPanel = true;  // New property to track if we're showing the main admin panel
  showingChannels = false;
  channels: ChatRoom[] = [];
  showAddChannelModal = false;
  newChannel: { name: string; groupId: string } = { name: '', groupId: '' };

  constructor(
    private authService: AuthenticationService,
    public navigationService: NavigationService,
    public chatService: ChatService,
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
    this.showingAdminPanel = false;
    this.showingChannels = false;
  }

  showGroups() {
    this.showingGroups = true;
    this.showingUsers = false;
    this.showingAdminPanel = false;
    this.showingChannels = false;
  }

  showChannels() {
    this.showingAdminPanel = false;
    this.showingUsers = false;
    this.showingGroups = false;
    this.showingChannels = true;
    this.loadChannels();
  }

  showAdminPanel(): void {
    this.showingUsers = false;
    this.showingGroups = false;
    this.showingAdminPanel = true;
    this.showingChannels = false;
  }

  promoteToGroupAdmin(user: User) {
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

  removeGroup(group: Group) {
        this.deleteWithAuth(`groups/${group.groupId}`).subscribe(
      () => {
        this.groups = this.groups.filter(g => g._id !== group._id);
        this.adminGroups = this.adminGroups.filter(g => g._id !== group._id);
        console.log(`Group ${group.name} removed`);
      },
      (error) => console.error('Error removing group:', error)
    );
  }

  editGroup(group: Group) {
    const newGroupName = prompt('Enter new group name:', group.name);
    if (newGroupName && newGroupName !== group.name) {
      const sanitizedGroupName = newGroupName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      if (sanitizedGroupName) {
        this.putWithAuth<Group>(`groups/${group.groupId}`, { name: sanitizedGroupName }).subscribe(
          (updatedGroup: Group) => {
            const index = this.groups.findIndex(g => g.groupId === group.groupId);
            if (index !== -1) {
              this.groups[index] = updatedGroup;
            }
            const adminIndex = this.adminGroups.findIndex(g => g.groupId === group.groupId);
            if (adminIndex !== -1) {
              this.adminGroups[adminIndex] = updatedGroup;
            }
            console.log(`Group ${group.name} updated to ${updatedGroup.name}`);
          },
          (error) => console.error('Error updating group:', error)
        );
      } else {
        alert('Invalid group name. Please use only letters, numbers, and spaces.');
      }
    }
  }

  createGroup() {
    const groupName = prompt('Enter group name:');
    if (groupName) {
      const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
      if (sanitizedGroupName) {
        this.postWithAuth<Group>('groups', { name: sanitizedGroupName }).subscribe(
          (newGroup) => {
            this.groups.push(newGroup);
            this.adminGroups.push(newGroup);
            console.log(`Group ${newGroup.name} created with ID: ${newGroup.groupId}`);
          },
          (error) => console.error('Error creating group:', error)
        );
      } else {
        alert('Invalid group name. Please use only letters, numbers, and spaces.');
      }
    }
  }

  createChatRoom(group: Group) {
    const chatRoomName = prompt('Enter chat room name:');
    if (chatRoomName) {
      this.postWithAuth<ChatRoom>(`groups/${group._id}/chatrooms`, { name: chatRoomName }).subscribe(
        (newChatRoom: ChatRoom) => {
          if (!group.chatrooms) {
            group.chatrooms = [];
          }
          group.chatrooms.push(newChatRoom);
          console.log(`Chat room ${newChatRoom.chatRoomName} created in group ${group.name}`);
        },
        (error) => console.error('Error creating chat room:', error)
      );
    }
  }

  editChatRoom(group: Group, chatRoom: ChatRoom) {
    const newChatRoomName = prompt('Enter new chat room name:', chatRoom.chatRoomName);
    if (newChatRoomName && newChatRoomName !== chatRoom.chatRoomName) {
      this.postWithAuth<ChatRoom>(`groups/${group._id}/chatrooms/${chatRoom.chatRoomId}`, { name: newChatRoomName }).subscribe(
        (updatedChatRoom: ChatRoom) => {
          const index = group.chatrooms?.findIndex(c => c._id === chatRoom._id) ?? -1;
          if (index !== -1 && group.chatrooms) {
            group.chatrooms[index] = updatedChatRoom;
          }
          console.log(`Chat room ${chatRoom.chatRoomName} updated to ${updatedChatRoom.chatRoomName} in group ${group.name}`);
        },
        (error) => console.error('Error updating chat room:', error)
      );
    }
  }

  removeChatRoom(group: Group, chatRoom: ChatRoom) {
    this.deleteWithAuth(`groups/${group._id}/chatrooms/${chatRoom.chatRoomId}`).subscribe(
      // this.deleteWithAuth(`chatrooms/${chatRoom._id}`).subscribe(
        () => {
        if (group.chatrooms && Array.isArray(group.chatrooms)) {
          group.chatrooms = group.chatrooms.filter((c: ChatRoom) => c._id !== chatRoom._id);
          console.log(`Chat room ${chatRoom.chatRoomName} removed from group ${group.name}`);
        } else {
          group.chatrooms = [];
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

  loadChannels() {
    this.getWithAuth<ChatRoom[]>('chatrooms').subscribe(
      (channels) => {
        this.channels = channels;
      },
      (error) => console.error('Error loading channels:', error)
    );
  }

  openAddChannelModal() {
    this.showAddChannelModal = true;
  }

  cancelAddChannel() {
    this.showAddChannelModal = false;
    this.newChannel = { name: '', groupId: '' };
  }

  addChannel() {
    if (this.newChannel.name && this.newChannel.groupId) {
      this.postWithAuth<ChatRoom>('chatrooms', this.newChannel).subscribe(
        (newChannel) => {
          this.channels.push(newChannel);
          this.showAddChannelModal = false;
          this.newChannel = { name: '', groupId: '' };
        },
        (error) => console.error('Error adding channel:', error)
      );
    }
  }

  editChannel(channel: ChatRoom) {
    const newName = prompt('Enter new channel name:', channel.chatRoomName);
    if (newName && newName !== channel.chatRoomName) {
      this.putWithAuth<ChatRoom>(`chatrooms/${channel._id}`, { chatRoomName: newName }).subscribe(
        (updatedChannel) => {
          const index = this.channels.findIndex(c => c._id === channel._id);
          if (index !== -1) {
            this.channels[index] = updatedChannel;
          }
        },
        (error) => console.error('Error updating channel:', error)
      );
    }
  }

  removeChannel(channel: ChatRoom) {
    if (confirm(`Are you sure you want to remove the channel "${channel.chatRoomName}"?`)) {
      this.deleteWithAuth(`chatrooms/${channel._id}`).subscribe(
        () => {
          this.channels = this.channels.filter(c => c._id !== channel._id);
        },
        (error) => console.error('Error removing channel:', error)
      );
    }
  }

  getGroupName(groupId: string): string {
    const group = this.groups.find(g => g._id === groupId);
    return group ? group.name : 'Unknown';
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
