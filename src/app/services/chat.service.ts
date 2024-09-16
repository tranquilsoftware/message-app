import { Injectable } from '@angular/core';
import {Observable, toArray} from 'rxjs'
import {SocketService} from "./socket.service";

export interface Message {
  chatRoomId: string;
  senderId: {
    username: string;
    profile_pic: string;
  };
  msgContent: string;
  timestamp: Date | string | number;
  read: boolean;


}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private socket: SocketService) {
  }

  getSocket(): SocketService {
    return this.socket;
  }

  sendMessage(message: Message) {
    this.socket.sendMessage(message);
  }

  getMessages(room_id: string): Observable<Message[]> {
    return this.socket.onNewMessage().pipe(toArray());
  }


  // User requested to join the group room!
  joinRoom(room_id: string) {
    this.socket.joinRoom(room_id);
  }

  leaveRoom(room_id: string) {
    this.socket.getSocket().emit('leave-room', room_id);
  }


  // bool to check connection status
  isConnected(): boolean {
    return this.socket.getSocket().connected;
  }

  // manual reconnect function
  reconnect(): Observable<void> {
    return new Observable((observer) => {
      if (this.socket.getSocket().connected) {
        // Socket already connected.
        observer.next();
        observer.complete();
      } else {
        // Socket yet to be setup. Connect!
        this.socket.connect();
        this.socket.getSocket().once('connect', () => {
          observer.next();
          observer.complete();
        });
      }
    });
  }



// use in phase 2
//   getInitialMessages(room_id: string): Observable<Message[]> {
//     this.chatService.getMessages(this.room_id);
//   }

  // This retrieves the group room participants within a group room.
  getRoomMembers(roomId: string): Observable<string[]> { // array of group member's names
    return new Observable((observer) => {
      this.socket.getSocket().emit('get-room-members', roomId);
      this.socket.getSocket().once('room-members', (participants: string[]) => {
        observer.next(participants);
        observer.complete();
      });
    });
  }

  getChatRoomName(roomId: string): Observable<string> {
    return new Observable((observer) => {
      this.socket.getSocket().emit('get-chat-room-name', roomId);
      this.socket.getSocket().once('chat-room-name', (name: string) => {
        observer.next(name);
        observer.complete();
      });
    });
  }


  onNewMessage(): Observable<Message> {
      return this.socket.onNewMessage();
  }
}

  // When first joining a group chat, we have to obviously intiialize the messages first,
  // //    we do that here.




