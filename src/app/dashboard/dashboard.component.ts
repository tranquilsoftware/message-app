import { Component, OnInit } from '@angular/core';
import {CommonModule } from '@angular/common';
import {Router} from "@angular/router";
import * as toastr from "toastr";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnInit {
  currentDate: string = '';
  currentTime: string = '';

  constructor(private router: Router) {
    console.log('DashboardComponent constructor called');
  }

  ngOnInit() {
    console.log('DashboardComponent ngOnInit called');
    const authToken = localStorage.getItem('auth_token');

    if (!authToken) {
      console.log('No auth token found, redirecting to login');
      this.router.navigate(['/login']).then(r => {
        toastr.error('No auth token found. Redirecting to login page.');
      });
    } else {
      console.log('Auth token found, initializing dashboard');
      this.initializeDashboard();
    }
  }

  initializeDashboard() {
    console.log('Initializing dashboard');
  }


}
