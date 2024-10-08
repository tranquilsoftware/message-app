import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import Peer, { MediaConnection } from 'peerjs';
import { NavigationService } from '../services/navigation.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.css'
})
export class VideoChatComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;

  private peer: Peer;
  private localStream: MediaStream | null = null; // my webcam
  private remoteStream: MediaStream | null = null; // their webcam
  private currentCall: MediaConnection | null = null; 
  private roomId: string = '';

  public errorMessage: string = '';

  constructor(
    private chatService: ChatService,
    private navigationService: NavigationService,
    private route: ActivatedRoute
  ) {
    this.peer = new Peer();
  }

ngOnInit() {
  this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
  this.initializePeer();
}

private initializePeer() {
  this.peer = new Peer();

  this.peer.on('open', (id: string) => {
    console.log('My peer ID is: ' + id);
    this.chatService.emitPeerId(id);
  });

  this.peer.on('call', (call) => {
    this.listenForCalls(call);
  });
}

  async startCall(): Promise<void> {
    const remotePeerId = prompt('Enter the peer ID to call:');
    if (remotePeerId) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then((stream: MediaStream) => {
          this.localStream = stream;
          this.localVideo.nativeElement.srcObject = stream;
          const call = this.peer!.call(remotePeerId, stream);
          call.on('stream', (remoteStream: MediaStream) => {
            this.remoteVideo.nativeElement.srcObject = remoteStream;
          });
        })
        .catch((err) => {
          console.error('Failed to get local stream', err);
          this.errorMessage = 'Failed to access local camera and mic.';
        });
    }
  }

  private async listenForCalls(call: MediaConnection): Promise<void> {
    if (!this.localStream) {
      await this.startCall();
    }
    call.answer(this.localStream!);
    this.setupCallEvent(call);
  }

  private setupCallEvent(call: MediaConnection): void {
    call.on('stream', (remoteStream) => {
      this.remoteStream = remoteStream;
      this.remoteVideo.nativeElement.srcObject = this.remoteStream;
    });

    call.on('close', () => {
      this.endCall();
    });

    this.currentCall = call;
  }

  endCall() {
    if (this.currentCall) {
      this.currentCall.close();
    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;
    this.localStream = null;
    this.remoteStream = null;
    this.navigationService.navigateToChatRoom(this.roomId);

  }
}
