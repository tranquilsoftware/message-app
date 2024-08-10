import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'message-app';

  constructor(private router: Router) {
  }

  ngOnInit(): void {
    // go to login page on page lyaod
    this.router.navigate(['/login']);
  }
}
