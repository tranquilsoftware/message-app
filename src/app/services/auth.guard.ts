import { CanActivateFn, Router } from '@angular/router';
import { AuthenticationService } from "./authentication.service";
import { inject } from '@angular/core';
import {map} from "rxjs/operators";

export const authGuard: CanActivateFn = (route, state) => {
  // Inject AuthenticationService and Router
  const authService = inject(AuthenticationService);
  const router = inject(Router);

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
