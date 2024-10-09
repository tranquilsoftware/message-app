import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService, Message } from '../services/chat.service';
import { Subscription } from 'rxjs';
import {AuthenticationService, User} from "../services/authentication.service";
import {NavigationService} from "../services/navigation.service";
import {SettingsService} from "../settings.service";
import {DarkModeService} from "../services/dark-mode.service";
import { ChangeDetectorRef } from '@angular/core'; // for updating a new message on chat room
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './chat-room.component.css',
  templateUrl: 'chat-room.component.html'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  // Attributes
  chatRoomId:   string = '';
  messages:     Message[] = []; // declare a Message array. This is what is used in the front end for msgs on screen
  newMessage:   string = ''; // user message in message box..
  chatRoomName: string = '';
  showVideoChat: boolean = false;
  roomMembers: { username: string; profile_pic: string }[] = [];

  private messageSubscription: Subscription | undefined;
  private currentUser: User | null = null;
  defaultAvatar: string = './img/default_user.png';
  private apiUrl = 'http://localhost:5000/api';

  // Constructor
  constructor(
    private route:       ActivatedRoute,
    public  settingsService: SettingsService,
    private navigationService: NavigationService,
    private chatService: ChatService,
    public authenticationService: AuthenticationService,
    private cdr: ChangeDetectorRef,
    private http: HttpClient
  ) {}


  // Inherited function overrides
  ngOnInit(): void {
    // connect to socket. (likely disconnected)
    // this.chatService.getSocket().connect();
    this.ensureSocketConnection();

    console.log('Socket connected:', this.chatService.getSocket().isConnected());

    // join room
    this.chatRoomId = this.route.snapshot.paramMap.get('id') || '';
    this.chatService.joinRoom(this.chatRoomId);

    // get chat room name
    this.getChatRoomName();

    // load msgs
    this.loadInitialMessages();

    // load chat rooms initial msgs from db
    this.chatService.getSocket().getSocket().on('initial-messages', (messages: Message[]) => {
      this.messages = messages;
    });

    // fetch room members
    this.fetchRoomMembers();

    // ask from sockets
    this.listenForNewMessages();
    this.scrollToBottom();

    // initialise who the user is so we dont have to keep fetching
    this.authenticationService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }


  ngOnDestroy(): void {

    // Check valid, before we unsubcribe
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Lastly, leave the room. & disconnect socket.
    this.chatService.leaveRoom(this.chatRoomId);

    this.chatService.getSocket().disconnect();
  }


  private ensureSocketConnection() {
    if (!this.chatService.isConnected()) {
      this.chatService.reconnect().subscribe({
        next: () => {
          console.log('Socket reconnected successfully');
        },
        error: (error) => {
          console.error('Failed to reconnect socket:', error);
        }
      });
    }
  }



  loadInitialMessages(): void {
    this.chatService.getMessages(this.chatRoomId).subscribe(
      (messages) => {
        this.messages = messages.filter(message => message.chatRoomId === this.chatRoomId)
          .map(message => ({
            ...message,
            timestamp: new Date(message.timestamp)
          }));
      },
      (error) => {
        console.error('Error loading messages:', error);
      }
    );
  }





  listenForNewMessages(): void {

    this.messageSubscription = this.chatService.onNewMessage().subscribe(
      (message: Message) => {
        console.log('Received new message:', message);

        if (message.chatRoomId === this.chatRoomId) {

          message.timestamp = new Date(message.timestamp);
          this.messages.push(message);
          this.scrollToBottom();
          this.cdr.detectChanges();

          console.log('Updated messages array with:', message);
        }
      },
      (error) => {
        console.error('Error subscribing to new messages:', error);
      }
    );
  }

  // maybe has a image path..
  sendMessage(imagePath?: string) {
    if (!this.newMessage.trim() && !imagePath) {
      return;
    }

    if (!this.chatService.isConnected()) {
      console.error('Cannot send message: Socket not connected');
      console.log('Socket is not connected, reconnecting...');
      this.ensureSocketConnection();
    }


    this.authenticationService.getCurrentUser().subscribe(
      currentUser => {
        this.currentUser = currentUser;
      }
    );

    if (!this.currentUser) {
      console.error('User is not authenticated');
      return;
    }

    const message: Message = {
      chatRoomId: this.chatRoomId,
      senderId: {
        username: this.currentUser.username,
        profile_pic: this.currentUser.profile_pic || this.defaultAvatar,
      },
      msgContent: this.newMessage,
      imageUrl: imagePath || undefined,
      timestamp: new Date(),
      read: false
    };

    console.log('Sending message:', message);
    this.chatService.sendMessage(message);
    this.newMessage = ''; // reset input form
  }

  getChatRoomName(): void {
    this.chatService.getChatRoomName(this.chatRoomId).subscribe((chatRoomName) => {
      this.chatRoomName = chatRoomName;
    });
  }


  isCurrentUser(username: string): boolean {
    return this.currentUser && this.currentUser.username
      ? this.currentUser.username.trim().toLowerCase() === username.trim().toLowerCase()
      : false;
  }

  // For when we receive a new message, from socket.. scroll to the bottom inside the message container
  private scrollToBottom() {
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages-container');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }


  goToDashboard(): void {
    this.navigationService.navigateToDashboard();
  }

  formatTimestamp(date: Date | string | number): string {
    if (!(date instanceof Date)) {
      date = new Date(date);
    }
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }

    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const cases: { condition: boolean; value: string }[] = [
      { condition: date.toDateString() === now.toDateString(), value: 'today' },
      { condition: date.toDateString() === yesterday.toDateString(), value: 'yesterday' },
      { condition: now.getFullYear() === date.getFullYear(), value: 'thisYear' },
    ];

    const caseValue = cases.find((c) => c.condition)?.value;

    switch (caseValue) {
      case 'today':
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      case 'yesterday':
        return `Yesterday ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;

      case 'thisYear':
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });

      default:
        return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

    }

  }

  fetchRoomMembers(): void {
    this.chatService.getRoomMembers(this.chatRoomId).subscribe(
      (members) => {
        this.roomMembers = members;
        console.log('Room members:', this.roomMembers);
      },
      (error) => {
        console.error('Error fetching room members:', error);
      }
    );
  }

  // VIDEO CHAT METHODS

  startVideoChat() {
    this.navigationService.navigateToVideoChat(this.chatRoomId);
    this.showVideoChat = true;
  }

  // upload image to server, then send to chat room.
  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.chatService.uploadImage(file).subscribe({
        next: (response) => {
          console.log('Image uploaded successfully:', response);
          this.sendMessage(response.imageUrl); // Pass the image URL to sendMessage
        },
        error: (error) => {
          console.error('Error uploading image:', error);
        }
      });
    }
  }

  uploadImage(file: File): void {
    const formData = new FormData();
    formData.append('image', file);

    this.http.post<{ imageUrl: string }>(`${this.apiUrl}/messages/upload-image`, formData).subscribe(
      response => {
        this.sendImageMessage(response.imageUrl);
      },
      error => {
        console.error('Error uploading image:', error);
      }
    );
  }

  sendImageMessage(imageUrl: string): void {
    const message: Message = {
      chatRoomId: this.chatRoomId,
      senderId: {
        username: this.currentUser?.username || 'User',
        profile_pic: this.currentUser?.profile_pic || this.defaultAvatar
      },
      msgContent: '',
      imageUrl: imageUrl,
      timestamp: new Date(),
      read: false
    };

    this.chatService.sendMessage(message);
    this.messages.push(message);
    this.scrollToBottom();
  }

  onFileInputClick() {
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fileInput.click();
  }
}

