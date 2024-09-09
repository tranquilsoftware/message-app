import {Injectable} from '@angular/core';
import {Observable} from "rxjs";
import {io, Socket} from "socket.io-client";
import {AuthenticationService} from "./authentication.service";
import {Message} from "./chat.service";
import {HttpClient} from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  constructor(private authenticationService: AuthenticationService,
              private http: HttpClient)
  {
    // This is the URL that the socket is connecting to.
    const SOCKET_ENDPOINT = 'http://localhost:5000';

    this.socket = io(SOCKET_ENDPOINT, {
      transports: ['websocket'],
      upgrade: false
    });

  // always handle any errors
    this.handleSocketErrors();
  }

  getSocket(): Socket {
    return this.socket;
  }

  connect() {
    this.socket.connect();

  }

  disconnect() {
    this.socket.disconnect();
  }

  joinRoom(roomId: string) {
    this.socket.emit('join', roomId);
  }


  sendMessage(message: any) {
    message.token = this.authenticationService.getToken();

    console.log('Sending message to socket:', message);
    return this.socket.emit('new-message', message);
  }

  onNewMessage(): Observable<Message> {
    return new Observable(observer => {
      this.socket.on('new-message', (message: Message) => {
        // message.token = this.authenticationService.getToken();
        // do we need tokens in message rn? prob not

        observer.next(message);
      });

      // Cleanup when subscription is unsubscribed
      return () => {
        this.socket.off('new-message');
      };
    });

  }



  // Report any socket errors.
  private handleSocketErrors() {

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('message-error', (error) => {
      console.error('Message error:', error);
    })

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
