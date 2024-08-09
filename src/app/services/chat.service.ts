import { Injectable } from '@angular/core';
import { Observable } from 'rxjs'
import { io, Socket } from 'socket.io-client';

const url = 'http://localhost:4200';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
private socket: Socket;

  constructor() {
    this.socket = io(url);
  }

  sendMessage(room_id: string, message: string) {
    this.socket.emit('new-message', {room_id, message });
  }

  getMessages(room_id: string): Observable<any> {
    return new Observable((observer) => {

      this.socket.on('new-message', (data) => {
        if (data.room_id == room_id) { // validation conditional check
          observer.next(data.message);
        }
      })
    })
  }

  joinRoom(room_id: string) {
    this.socket.emit('join-room', room_id);
  }

  leaveRoom(room_id: string) {
    this.socket.emit('leave-room', room_id);
  }
}
