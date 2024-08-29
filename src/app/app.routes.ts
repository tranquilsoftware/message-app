import { RouterModule, Routes } from '@angular/router';
import { NgModule } from '@angular/core';

// Page Components
import { LoginComponent } from "./login/login.component";
import { ChatRoomComponent } from "./chat-room/chat-room.component";
import { AdminPanelComponent} from "./admin-panel/admin-panel.component";
import { SettingsComponent } from "./settings/settings.component";
import { DashboardComponent } from "./dashboard/dashboard.component"
import { RegisterUserComponent } from "./register-user/register-user.component";

// AuthGuard (for login token logic)
import { authGuard } from './services/auth.guard';
import {AuthenticationService} from "./services/authentication.service";

export const routes: Routes = [ // Define URL Routing

  //   e.g. going to 'localhost:xxxx' automatically redirects to 'localhost:xxxx/dashboard'. :)
  { path: '',           redirectTo: '/dashboard',     pathMatch: 'full' },

  // Define other component & correlated url paths
  { path: 'login',      component: LoginComponent },
  { path: 'register',   component: RegisterUserComponent },
  { path: 'admin',      component: AdminPanelComponent, canActivate: [authGuard] },
  { path: 'settings',   component: SettingsComponent, canActivate: [authGuard] },
  { path: 'dashboard',  component: DashboardComponent, canActivate: [authGuard] }, // if user is no longer signed in, dashboard will redirect to the login component.

  // chat room (id - id of user we are communicating with)
  { path: 'chat/:id',   component: ChatRoomComponent, canActivate: [authGuard] },

  // Error handling (Error 404 reroute):
  { path: '**',           redirectTo: '/login',     pathMatch: 'full' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
