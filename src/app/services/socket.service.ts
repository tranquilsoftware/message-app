import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { AuthenticationService } from './authentication.service';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Message } from './chat.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket!: Socket;
  private connectionStatus = new BehaviorSubject<boolean>(false);

  constructor(
    private authenticationService: AuthenticationService,
    private http: HttpClient
  ) {
    this.initSocket();
  }

  private initSocket() {
    const SOCKET_ENDPOINT = 'http://localhost:5000';
    console.log('Initializing Socket Service with endpoint:', SOCKET_ENDPOINT);

    // this.socket = io(SOCKET_ENDPOINT, {
    //   transports: ['websocket', 'polling'],
    //   upgrade: true,
    //   autoConnect: false,
    //   withCredentials: true,
    //   forceNew: true
    // });

    // this.socket = io(SOCKET_ENDPOINT); // working.!!

    this.socket = io(SOCKET_ENDPOINT, {
      withCredentials: true,
      forceNew: true
    }); // working.!!

-
    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    this.socket.on('connect', () => {
      console.log('Socket connected successfully');
      this.connectionStatus.next(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connectionStatus.next(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.connectionStatus.next(false);
    });
  }

  connect() {
    if (!this.socket.connected) {
      console.log('Attempting to connect socket...');
      this.socket.connect();
    }
  }

  disconnect() {
    if (this.socket.connected) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
    }
  }

  joinRoom(roomId: string) {
    if (this.socket.connected) {
      console.log('Joining room:', roomId);
      this.socket.emit('join', roomId);
    } else {
      console.error('Cannot join room: Socket not connected');
    }
  }

  sendMessage(message: any) {
    if (this.socket.connected) {
      message.token = this.authenticationService.getToken();
      console.log('Sending message to socket:', message);
      this.socket.emit('new-message', message);
    } else {
      console.error('Cannot send message: Socket not connected');
    }
  }

  getSocket(): Socket {
    return this.socket;
  }

  isConnected(): Observable<boolean> {
    return this.connectionStatus.asObservable();
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('new-message', (message: Message) => {
        observer.next(message);
        observer.complete();
        console.log('Received new message from socket:', message);
      });

      // Cleanup when subscription is unsubscribed
      return () => {
        this.socket.off('new-message');
      };
    });

  }
}


