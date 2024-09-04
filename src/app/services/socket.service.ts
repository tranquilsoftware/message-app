import { Injectable } from '@angular/core';
import {filter, Observable} from "rxjs";
import {Socket, io} from "socket.io-client";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  constructor()
  {
    const SOCKET_ENDPOINT = 'http://localhost:5000';
    // const SOCKET_ENDPOINT = 'ws://localhost:5000/socket.io/';

    this.socket = io(SOCKET_ENDPOINT, {
      transports: ['websocket'],
      upgrade: false
    });

    this.handleSocketErrors(); // always handle any errors
  }

  getSocket(): Socket {
    return this.socket;
  }

  connect() {
    this.socket.connect(); // this wseems to work!

  }

  disconnect() {
    this.socket.disconnect();
  }

  joinRoom(roomId: string) {
    this.socket.emit('join', roomId);
  }

  sendMessage(message: any) {
    console.log('Sending message to socket:', message);
    this.socket.emit('new-message', message);
  }

  onMessage(): Observable<any> {
    return new Observable(observer => {
      this.socket.on('new-message', (data) => {
        observer.next(data);
      });

      // Cleanup when subscription is unsubscribed
      return () => {
        this.socket.off('new-message');
      };
    });
    // ).pipe(
    //
    //   filter((message) => message.chatRoomId === getcurrentUser.is in room_id) (filter from rxjs) -- psudocodes
  }


// Report any socket errors.
private handleSocketErrors() {
    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });


    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });


    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });


    this.socket.on('connect_timeout', () => {
      console.error('Socket connection timed out');
    });


    this.socket.on('reconnect', () => {
      console.log('Socket reconnected');
    });


    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnect error:', error);
    });
  }

}
