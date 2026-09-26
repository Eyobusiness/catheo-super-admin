import { TestBed } from '@angular/core/testing';
import { PrintService } from './print.service';

describe('PrintService', () => {
  let service: PrintService;
  let printSpy: any;

  beforeEach(() => {
    vi.useFakeTimers();
    printSpy = vi.fn();
    vi.spyOn(window, 'print').mockImplementation(printSpy as any);

    TestBed.configureTestingModule({
      providers: [PrintService],
    });

    service = TestBed.inject(PrintService);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call window.print() when printing without custom title', () => {
    service.printDocument();
    expect(printSpy).toHaveBeenCalled();
  });

  it('should temporarily update document.title when custom title is provided and restore it', () => {
    const originalTitle = document.title;
    const customTitle = 'Rapport Annuel 2026 - OPPE Saint-Jean';

    service.printDocument(customTitle);

    expect(printSpy).toHaveBeenCalled();
    expect(document.title).toBe(customTitle);

    vi.advanceTimersByTime(1100);
    expect(document.title).toBe(originalTitle);
  });
});
