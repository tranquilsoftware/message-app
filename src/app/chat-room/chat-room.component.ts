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
  templateUrl: 'chat-room.component.html'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  // Attributes
  chatRoomId:   string = '';
  messages:     Message[] = []; // declare a Message array. This is what is used in the front end for msgs on screen
  newMessage:   string = ''; // user message in message box..
  chatRoomName: string = '';
  showVideoChat: boolean = false;

  private messageSubscription: Subscription | undefined;

  // Constructor
  constructor(
    private route:       ActivatedRoute,
    public  settingsService: SettingsService,
    private navigationService: NavigationService,
    private chatService: ChatService,
    public authenticationService: AuthenticationService,
  ) {}


  // Inherited function overrides
  ngOnInit(): void {
    // connect to socket. (likely disconnected)
    this.chatService.getSocket().connect();

    // join room
    this.chatRoomId = this.route.snapshot.paramMap.get('id') || '';
    this.chatService.joinRoom(this.chatRoomId);

    // get chat room name
    this.getChatRoomName();

    // load msgs
    this.loadInitialMessages();

    // load chat rooms initial msgs from db
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

}

