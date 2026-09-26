import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiClient } from '@core/services/api-client.service';
import { AuthService } from '@core/services/auth.service';
import { ForgotPasswordPayload, ResetPasswordPayload } from '../models/auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthFeatureService {
  private readonly api = inject(ApiClient);
  readonly auth = inject(AuthService);

  forgotPassword(payload: ForgotPasswordPayload): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('auth/forgot-password', payload).pipe(map((res) => res.data));
  }

  resetPassword(payload: ResetPasswordPayload): Observable<{ message: string }> {
    return this.api.post<{ message: string }>('auth/reset-password', payload).pipe(map((res) => res.data));
  }
}
