import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, throwError, BehaviorSubject} from "rxjs";
import {tap, catchError, map} from "rxjs/operators";
import {ChatRoom} from "./authentication.service";

export interface Group {
  groupId: string;
  groupName: string;
  chatRooms: ChatRoom[];
}

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:5000/api';
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadGroups();
  }

  loadGroups() {
    this.http.get<Group[]>(`${this.apiUrl}/groups`).subscribe(
      groups => this.groupsSubject.next(groups),
      error => console.error('Error loading groups', error)
    );
  }

  loadChatrooms(groupId: string): Observable<ChatRoom[]> {
    return this.http.get<ChatRoom[]>(`${this.apiUrl}/chatrooms`).pipe(
      map((chatRooms: ChatRoom[]) => chatRooms.filter(chatroom => chatroom.groupId === groupId)),
      map((groupChatRooms: ChatRoom[]) => groupChatRooms.map(chatroom => ({
        ...chatroom,
        visible: false
      })))
    );
  }



}
