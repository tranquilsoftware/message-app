import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from "./authentication.service";
import { inject } from '@angular/core';
import {map} from "rxjs/operators";

export const authGuard: CanActivateFn = (route, state) => {
  // Inject AuthenticationService and Router
  const authService = inject(AuthenticationService);
  const router = inject(Router);

  // // Check if the user is authenticated
  // if (authService.isAuthenticated()/* && !authService.isTokenExpired()*/) {
  //   return true; // User is authenticated, allow access
  // } else {
  //   // Redirect to login page if not authenticated
  //   router.navigate(['/login']).then(r => console.log('Going to login!'));
  //   return false; // User is not authenticated, deny access
  // }
  return authService.isAuthenticated().pipe(
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    })
  );
};
