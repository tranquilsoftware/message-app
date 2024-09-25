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



@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './chat-room.component.css',
  template: `
    <div class="chat-container" >
      <div class="chat-header">

        <!--        BACK TO DASHBOARD-->
        <button class="back-button" (click)="goToDashboard()">
          <!-- SVG Of Left Arrow Icon -->

          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        <!--    People In Room    -->
        <div class="chat-info">
         <h2>{{ chatRoomName }}</h2>
        </div>



        <!--        VIDEO CALL BUTTON-->
        <button class="video-call-button" (click)="startVideoChat()">
          <!-- SVG Of Video Camera Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </button>
      </div>


      <!--       Attempt at drawing messages on screen.. -->
      <div class="chat-messages-container">
        <div *ngFor="let message of messages"
             [ngClass]="{'message': true, 'sent': isCurrentUser(message.senderId.username), 'received': !isCurrentUser(message.senderId.username)}">
          <div class="message-content">{{ message.msgContent }}</div>
          <div *ngIf="settingsService.showTimestampOnMessages" class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
        </div>
      </div>

      <div class="chat-input">
        <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type something here...">
        <button (click)="sendMessage()">Send</button>
      </div>
    </div>
  `
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  // Attributes
  chatRoomId:   string = '';
  // public chatRoomMembers: string[] = []; todo
  messages:     Message[] = []; // declare a Message array. This is what is used in the front end for msgs on screen
  newMessage:   string = ''; // user message in message box..
  isDark: boolean = false;
  chatRoomName: string = '';
  showVideoChat: boolean = false;

  private messageSubscription: Subscription | undefined;
  private darkModeSubscription: Subscription | undefined;

  // Constructor
  constructor(
    private route:       ActivatedRoute,
    public  settingsService: SettingsService,
    private navigationService: NavigationService,
    private chatService: ChatService,
    public authenticationService: AuthenticationService,
    // private darkModeService: DarkModeService,
  ) {}


  // Inherited function overrides
  ngOnInit(): void {

    // setup darkmode
    // this.darkModeSubscription = this.darkModeService.getDarkModeObservable()
    //   .subscribe(isDark => {
    //     this.isDark = isDark;
    //   });

    // connect to socket. (likely disconnected)
    this.chatService.getSocket().connect();

    // join room
    this.chatRoomId = this.route.snapshot.paramMap.get('id') || '';
    this.chatService.joinRoom(this.chatRoomId);

    // get chat room name
    this.getChatRoomName();

    // load msgs
    this.loadInitialMessages();

    this.chatService.getSocket().getSocket().on('initial-messages', (messages) => {
      this.messages = messages;
    });


    // ask from sockets
    this.listenForNewMessages();
    this.scrollToBottom();
  }


  ngOnDestroy(): void {

    // Check valid, before we unsubcribe
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    if (this.darkModeSubscription) {
      this.darkModeSubscription.unsubscribe();
    }

    // Lastly, leave the room. & disconnect socket.
    this.chatService.leaveRoom(this.chatRoomId);

    this.chatService.getSocket().disconnect();
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
        if (message.chatRoomId === this.chatRoomId) {
          message.timestamp = new Date(message.timestamp);
          this.messages.push(message);
          this.scrollToBottom();
        }
      }
    );
  }


  sendMessage(): void {
    if (!this.newMessage.trim()) {
      return console.log('Message is empty, not sending');
    }

    const currentUserId = this.authenticationService.getCurrentUserId();
    if (!currentUserId) {
      return console.error('User is not authenticated');
    }


    try {
      const message: Message = {
        chatRoomId: this.chatRoomId,
        senderId: {
          username: currentUserId, // use id for now
          profile_pic: '', // user.profile_pic
        },
        msgContent: this.newMessage,
        timestamp: new Date(),
        read: false
      };

      // Sends the message to the socket, which is placed into the MongoDB Server,
      //  messages are added client-sided through listenForNewMessages()
      this.chatService.sendMessage(message);

      this.newMessage = ''; // reset input form

    } catch (error) {

      console.error('Error fetching current user details:', error);

    }

  }

  getChatRoomName(): void {
    this.chatService.getChatRoomName(this.chatRoomId).subscribe((chatRoomName) => {
      this.chatRoomName = chatRoomName;
    });
  }


  isCurrentUser(userId: string): boolean {
    return userId === this.authenticationService.getCurrentUserId();
  }

  // For when we receive a new message, from socket..
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

  //todo setup button
  // toggleDarkMode() {
  //   this.darkModeService.toggleDarkMode();
  // }

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


  // VIDEO CHAT METHODS

  startVideoChat() {
    this.navigationService.navigateToVideoChat(this.chatRoomId);
    this.showVideoChat = true;
  }

  endVideoChat() {
    this.showVideoChat = false;
  }

}

