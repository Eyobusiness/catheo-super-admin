import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppToast } from './shared/ui/components/feedback/app-toast/app-toast.component';
import { LoadingService } from './core/services/loading.service';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    AppToast
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class App {
  private readonly themeService = inject(ThemeService);
  public readonly isLoading = inject(LoadingService).isLoading;
}
