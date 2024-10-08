import { Injectable } from '@angular/core';
import {HttpClient, HttpErrorResponse} from "@angular/common/http";
import {BehaviorSubject, Observable, switchMap, throwError} from "rxjs";
import {tap, catchError, map} from "rxjs/operators";
import {ChatRoom} from "./authentication.service";
import { AuthenticationService, User, Group } from './authentication.service';
import * as toastr from 'toastr';


@Injectable({
  providedIn: 'root'
})
export class GroupService {
  private apiUrl = 'http://localhost:5000/api';
  private groupsSubject = new BehaviorSubject<Group[]>([]);
  groups$ = this.groupsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthenticationService) {
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

  private handleError(error: HttpErrorResponse) {
    console.error('An error occurred:', error);
    toastr.error('Failed to add group. Please try again.');
    return throwError(() => new Error('Something went wrong; please try again later.'));
  }

  //     Group Admin Requests And Approval

  // for those not super admin, we have to request to join a group first!
  requestToJoinGroup(groupIdOrName: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/${groupIdOrName}/join-request`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).pipe(
      tap(response => console.log('Join request response:', response)),
      catchError(this.handleError)
    );
  }
  

  getPendingRequests(): Observable<any[]> {
    console.log('GroupService: Attempting to fetch pending requests');
    return this.http.get<any[]>(`${this.apiUrl}/groups/admin/pending-requests`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    }).pipe(
      tap(response => console.log('GroupService: Received response for pending requests', response)),
      catchError(error => {
        console.error('GroupService: Error fetching pending requests', error);
        console.error('GroupService: Error status:', error.status);
        console.error('GroupService: Error message:', error.message);
        console.error('GroupService: Error details:', error.error);
        return throwError(() => error);
      })
    );
  }

  approveJoinRequest(groupId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/admin/approve-request/${groupId}/${userId}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
  }

  rejectJoinRequest(groupId: string, userId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/groups/admin/reject-request/${groupId}/${userId}`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` }
    });
  }

  createGroup(newGroup: Partial<Group>): Observable<Group> {
    return this.authService.getCurrentUser().pipe(
      switchMap((user: User | null) => {
        if (user) {
          const groupToCreate = {
            ...newGroup,
            admins: [user._id],
            members: [user._id],
            pendingRequests: []
          };
          return this.http.post<Group>(`${this.apiUrl}/groups`, groupToCreate)
            .pipe(
              catchError(this.handleError),
              tap((createdGroup) => {
                this.groupsSubject.next([...this.groupsSubject.value, createdGroup]);
                toastr.success('Group created successfully');
              })
            );
        } else {
          toastr.error('User not authenticated');
          return throwError(() => new Error('User not authenticated'));
        }
      })
    );
  }
}
