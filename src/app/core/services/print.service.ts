import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class PrintService {
  /**
   * Lance l'impression de la page ou du document actif.
   * Modifie temporairement le titre du document si spécifié pour que le fichier
   * suggéré lors de l'action "Enregistrer au format PDF" du navigateur soit explicite.
   */
  public printDocument(documentTitle?: string): void {
    const originalTitle = document.title;
    if (documentTitle) {
      document.title = documentTitle;
    }

    try {
      window.print();
    } finally {
      if (documentTitle) {
        // Rétablir le titre d'origine après impression
        setTimeout(() => {
          document.title = originalTitle;
        }, 1000);
      }
    }
  }
}
