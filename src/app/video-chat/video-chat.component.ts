import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { ChatService } from '../services/chat.service';
import Peer, { MediaConnection } from 'peerjs';
import { NavigationService } from '../services/navigation.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-video-chat',
  standalone: true,
  imports: [],
  templateUrl: './video-chat.component.html',
  styleUrl: './video-chat.component.css'
})
export class VideoChatComponent implements OnInit {
  @ViewChild('localVideo') localVideo!: ElementRef;
  @ViewChild('remoteVideo') remoteVideo!: ElementRef;

  private peer: Peer | null = null;
  private localStream: MediaStream | null = null;
  private roomId: string;

  constructor(
    private chatService: ChatService,
    private route: ActivatedRoute
  ) {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

  }

ngOnInit() {
  this.initializePeer();
  
}

private initializePeer() {
  this.peer = new Peer();

  this.peer.on('open', (id: string) => {
    console.log('My peer ID is: ' + id);
    // You can emit this ID to the server to associate it with the user
    this.chatService.emitPeerId(id);
  });

  this.peer.on('call', (call: MediaConnection) => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream: MediaStream) => {
        this.localStream = stream;
        this.localVideo.nativeElement.srcObject = stream;
        call.answer(stream);
        call.on('stream', (remoteStream: MediaStream) => {
          this.remoteVideo.nativeElement.srcObject = remoteStream;
        });
      })
      .catch((err) => {
        console.error('Failed to get local stream', err);
      });
  });
}

  startCall() {
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
        });
    }
  }

  endCall() {
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    if (this.peer) {
      this.peer.destroy();
    }
    this.localVideo.nativeElement.srcObject = null;
    this.remoteVideo.nativeElement.srcObject = null;
  }
}
