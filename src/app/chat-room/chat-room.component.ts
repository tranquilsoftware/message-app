import {Component, OnDestroy, OnInit} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ChatService } from '../services/chat.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [],
  templateUrl: './chat-room.component.html',
  styleUrl: './chat-room.component.css'
})
export class ChatRoomComponent implements OnInit, OnDestroy {
  // Members
  chatRoomName: string = 'Undefined Chat Room';
  chatRoomId:   string = '';
  messages:     any[] = []; //declare messages as array... Array/Map should be like user: x, message: y
  newMessage:   string = ''; // user message in message box..
  private messageSubscription: Subscription | undefined;

  // Constructor
  constructor(
    private route:       ActivatedRoute,
    private chatService: ChatService
  ) {}

  // Inherited function overrides
  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.chatRoomId = params['id'];
      this.chatService.joinRoom(this.chatRoomId);

      // populate messages array with chat rooms messages.
      this.messageSubscription = this.chatService.getMessages(this.chatRoomId).subscribe(
        message => this.messages.push(message)
      );
    })
  }
  ngOnDestroy(): void {
    // Check valid, before we unsubcribe
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }

    // Lastly, leave the room. (optional??)
    this.chatService.leaveRoom(this.chatRoomId);
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.chatRoomId, this.newMessage);
      this.newMessage = '';
    }
  }



  /*
  TODO Functions:
   - show user list func,
   - showUserProfile(userId) - shows privledge power (super admin, group admin, user etc), shows user profile image

   */

}
