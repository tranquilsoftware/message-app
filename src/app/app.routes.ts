import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

// Page Components
import { LoginComponent } from "./login/login.component";
import { ChatRoomComponent } from "./chat-room/chat-room.component";
import { AdminPanelComponent} from "./admin-panel/admin-panel.component";
import { SettingsComponent } from "./settings/settings.component";
import { DashboardComponent } from "./dashboard/dashboard.component"

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})

// Define URL Routing
export const routes: Routes = [


  //   e.g. going to 'localhost:xxxx' automatically redirects to 'localhost:xxxx/dashboard'. :)
  { path: '',           redirectTo: '/dashboard',     pathMatch: 'full' },

  // Define other component & correlated url paths
  { path: 'login',      component: LoginComponent },
  { path: 'admin',      component: AdminPanelComponent },
  { path: 'settings',   component: SettingsComponent },
  { path: 'dashboard',  component: DashboardComponent }, // if user is no longer signed in, dashboard will redirect to the login component.

  // chat room (id - id of user we are communicating with)
  { path: 'chat/:id',   component: ChatRoomComponent },

  // Error handling (Error 404 reroute):
  { path: '',           redirectTo: '/dashboard',     pathMatch: 'full' },
];

export class AppRoutingModule { }
