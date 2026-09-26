import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session.service';
import { ApiErrorService } from '../services/api-error.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const sessionService = inject(SessionService);
  const apiErrorService = inject(ApiErrorService);

  const token = sessionService.token();
  const headers: Record<string, string> = {};

  if (!req.headers.has('Accept') && req.responseType !== 'blob') {
    headers['Accept'] = 'application/json';
  }

  if (token && !req.headers.has('Authorization')) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const authReq = req.clone({
    setHeaders: headers,
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Delegate global error interpretation and user feedback to ApiErrorService
      apiErrorService.handleError(error, true);
      return throwError(() => error);
    })
  );
};
