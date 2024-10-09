import { Injectable } from '@angular/core';
import {Observable } from 'rxjs'
import {SocketService} from "./socket.service";
import { HttpClient } from '@angular/common/http';
export interface Message {
  chatRoomId: string;
  senderId: {
    username: string;
    profile_pic: string;
  };
  msgContent: string;
  imageUrl?: string; // optional upload image
  timestamp: Date | string | number;
  read: boolean;
  type?: 'text' | 'text-with-image';
}


@Injectable({
  providedIn: 'root'
})
export class ChatService {
  constructor(private socket: SocketService,
    private http: HttpClient
  ) {}
  private apiUrl = 'http://localhost:5000/api';


  connect() {
    this.socket.connect();
  }

  sendMessage(message: Message) {
    //old
    this.socket.sendMessage(message);

    //new
    // Check if the message contains an imageUrl
    // return new Observable<void>(observer => {
    //   try {
    //     if (message.imageUrl) {
    //       // If imageUrl exists, send a message with both text and image
    //       this.socket.sendMessage({
    //         ...message,
    //         type: 'text-with-image'
    //       });
    //     } else {
    //       // else, send a regular text message
    //       this.socket.sendMessage({
    //         ...message,
    //         type: 'text'
    //       });
    //     }
    //     observer.next();
    //     observer.complete();
    //    } catch (error) {
    //       observer.error(error);
    //     }
    //   });
  }

  getMessages(room_id: string): Observable<Message[]> {
    return new Observable<Message[]>(observer => {
      this.socket.getSocket().emit('get-initial-messages', room_id);
      this.socket.getSocket().once('initial-messages', (messages: Message[]) => {
        observer.next(messages);
        observer.complete();
      });
    });
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


  // Video Chat Peer ID
  emitPeerId(peerId: string) {
    this.socket.getSocket().emit('peer-id', peerId);
  }

  // send message in chat
  uploadImage(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('image', file);

    return this.http.post(`${this.apiUrl}/messages/upload-image`, formData);
  }

  // This retrieves the group room participants within a group room.
  getRoomMembers(roomId: string): Observable<{ username: string; profile_pic: string }[]> { // array of group member's names
    return new Observable((observer) => {
      this.socket.getSocket().emit('get-room-members', roomId);
      this.socket.getSocket().once('room-members', (participants: { username: string; profile_pic: string }[]) => {
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

  getSocket(): SocketService {
    return this.socket;
  }
}



