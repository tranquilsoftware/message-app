import { Routes } from '@angular/router';

// Page Components
import { LoginComponent } from "./login/login.component";
import { ChatRoomComponent } from "./chat-room/chat-room.component";
import { AdminPanelComponent} from "./admin-panel/admin-panel.component";
import { SettingsComponent } from "./settings/settings.component";
import { DashboardComponent } from "./dashboard/dashboard.component"


// Define URL Routing
export const routes: Routes = [

  // Define going to Login page as default url 'webpage/'
  //   e.g. going to 'localhost:xxxx' automatically redirects to 'localhost:xxxx/login'. :)
  { path: '',           redirectTo: '/login',     pathMatch: 'full' },

  // Define other component & correlated url paths
  { path: 'login',      component: LoginComponent },
  { path: 'admin',      component: AdminPanelComponent },
  { path: 'settings',   component: SettingsComponent },
  { path: 'dashboard',  component: DashboardComponent },

  // chat room (id - id of user we are communicating with)
  { path: 'chat/:id',   redirectTo: 'chat/:id',   component: ChatRoomComponent },

  // Error handling (Error 404 reroute):
  { path: '**',         redirectTo: '/dashboard' } // if user is no longer signed in, dashboard will redirect to the login component.
];
