import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService, Message } from '../services/chat.service';
import { Subscription } from 'rxjs';
import {AuthenticationService, User} from "../services/authentication.service";
import {NavigationService} from "../services/navigation.service";


@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule],
  styleUrl: './chat-room.component.css',
  template: `
    <div class="chat-container">
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
          <!--        todo  chat room name here -->
<!--          <h2>Room</h2>-->
        </div>

        <!--        VIDEO CALL BUTTON-->
        <button class="video-call-button">
          <!-- SVG Of Video Camera Icon -->
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none"
               stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          </svg>
        </button>

      </div>


      <!--       Attempt at drawing messages on screen.. -->
      <div class="chat-messages">
        <div *ngFor="let message of messages"
             [ngClass]="{'message': true, 'sent': isCurrentUser(message.senderId.username), 'received': !isCurrentUser(message.senderId.username)}">
          <div class="message-content">{{ message.msgContent }}</div>
          <div class="message-timestamp">{{ formatTimestamp(message.timestamp) }}</div>
        </div>
      </div>

      <div class="chat-input">
        <input type="text" [(ngModel)]="newMessage" (keyup.enter)="sendMessage()" placeholder="Type a message...">
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
  private messageSubscription: Subscription | undefined;


  // Constructor
  constructor(
    private route:       ActivatedRoute,
    private navigationService: NavigationService,
    private chatService: ChatService,
    public authenticationService: AuthenticationService,
  ) {
    // this.socket = this.socketService.getSocket();
    this.chatService.reconnect();




  }

  // this.socket.connect();


  // Inherited function overrides
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.chatRoomId = params['id'];
      this.chatService.joinRoom(this.chatRoomId);
      this.loadInitialMessages();
      // this.subscribeToNewMessages();
    });
    /*
        this.socketService.connect();
        this.socketService.getSocket().emit('connection');

        this.socketService.joinRoom(this.chatRoomId);
        this.socketService.onMessage().subscribe(message => {
        //   //handle incoming message
          this.addMessage(message);
        //   // this.sendMessage();
        });
        //
        */




  }


  ngOnDestroy(): void {


    // Check valid, before we unsubcribe
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Lastly, leave the room.
    this.chatService.leaveRoom(this.chatRoomId);

  }

  openChat(chatRoomId: number): void {
    this.navigationService.navigateToChatRoom(chatRoomId);
  }


  loadMessages(): void {
    this.chatService.getMessages(this.chatRoomId).subscribe(
      (messages) => {
        console.log('LOADING MESSAGES!');
        this.messages = messages;
      },
      (error) => {
        console.error('Error loading messages:', error);
      }
    );
  }

  sendMessage(): void {
    const currentUserId = this.authenticationService.getCurrentUserId();
    if (!currentUserId) {
      console.error('User is not authenticated');
      return;
    }

    if (!this.newMessage.trim()) {
      console.log('Message is empty, not sending');
      return;
    }


    this.authenticationService.getCurrentUser().subscribe({
      next: (currentUser: User | null) => {
        if (!currentUser) {
          console.error('Unable to fetch current user details');
          return;
        }

  /*      const message: Message = {
          chatRoomId: this.chatRoomId,
          senderId: {
            username: currentUser.username,
            profile_pic: currentUser.profile_pic
          },
          msgContent: this.newMessage,
          timestamp: new Date(),
          read: false
        };

        console.log('Sending message:', message);

        // Send message to server (save to MongoDB)
        this.chatService.sendMessage(message);

        // Send message to client chat room
        this.addMessage(message);

        // Reset the message form input form.
        this.newMessage = '';*/
      },
      error: (error: any) => {
        console.error('Error fetching current user details:', error);
        if (error.error instanceof Error) {
          console.error('Error message:', error.error.message);
        } else {
          console.error('Error status:', error.status);
          console.error('Error body:', error.error);
        }
      }
    });
  }

  // This is client side, add message, it doesnt do any server side stuff
  addMessage(message: Message ) {
    this.messages.push(message);

    // Scroll to bottom of chat
    setTimeout(() => {
      const chatContainer = document.querySelector('.chat-messages');
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 0);
  }

  loadInitialMessages(): void {
    // this.chatService.getInitialRoomMessages(this.chatRoomId).subscribe(
    //   initialMessages => this.messages = initialMessages
    // );
    const initial_msg_1: Message = {
      chatRoomId: '1',
      senderId: {
        username: 'hardcoded',
        profile_pic: ''
      },
      msgContent: 'hello world!',
      timestamp: new Date(),
      read: false
    };

    const initial_msg_2: Message = {
      chatRoomId: '2',
      senderId: {
        username: 'bren',
        profile_pic: ''
      },
      msgContent: 'hey world!',
      timestamp: new Date(),
      read: false
    };

    this.messages = [initial_msg_1, initial_msg_2];
  }

  subscribeToNewMessages(): void {
    this.messageSubscription = this.chatService.getMessages(this.chatRoomId).subscribe(
      newMessages => this.messages.push(...newMessages)
    );
  }


  isCurrentUser(userId: string): boolean {
    return userId === this.authenticationService.getCurrentUserId();
  }

  formatTimestamp(date: Date): string {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }



  goToDashboard(): void {
    this.navigationService.navigateToDashboard();
  }
}

