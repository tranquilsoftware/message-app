import { Injectable } from '@angular/core';
import {Observable, toArray} from 'rxjs'
import {SocketService} from "./socket.service";


export interface Message {
  _id: string;
  chatRoomId: string;
  userId: string;
  senderId: {
    _id: string;
    username: string;
    profile_pic: string;
  };
  msgContent: string;
  timestamp: Date;
  read: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {

  constructor(private socket: SocketService) {
  }

  sendMessage(message: Message) {
    this.socket.sendMessage(message);
  }

  // getMessages(room_id: string): Observable<Message[]> {
  //   return this.socket.onMessage(); // todo review
  // }
  getMessages(room_id: string): Observable<Message[]> {
    return this.socket.onMessage().pipe(toArray());
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

  // When first joining a group chat, we have to obviously intiialize the messages first,
  // //    we do that here.
  // getInitialRoomMessages(roomId: string): Observable<Message[]> {
  //   return new Observable((observer) => {
  //     this.socket.emit('get-initial-messages', roomId);
  //     this.socket.once('initial-messages', (messages: Message[]) => {
  //       observer.next(messages);
  //       observer.complete();
  //     });
  //   });
  // }

  // This retrieves the group room participants within a group room.
  // getRoomMembers(roomId: string): Observable<string[]> { // array of group member's names
  //   return new Observable((observer) => {
  //     this.socket.emit('get-room-members', roomId);
  //     this.socket.once('room-members', (participants: string[]) => {
  //       observer.next(participants);
  //       observer.complete();
  //     });
  //   });
  // }


}
