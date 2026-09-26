# Guide de Déploiement en Production — Cathéo Super Admin & Organisation

**Application :** `catheo-super-admin`  
**Environnement cible :** Production Web (Nginx / Apache / Caddy / Cloud Storage CDN)  
**Date :** 24 Septembre 2026  

---

## 1. Préparation du Build de Production

### 1.1. Vérification des prérequis
Avant toute génération d'artefacts de production :
```bash
# 1. Vérifier l'intégrité TypeScript (doit retourner 0 erreur)
npx tsc --noEmit

# 2. Exécuter l'ensemble de la suite de tests (114 suites, 630 tests verts)
npx ng test
```

### 1.2. Configuration des variables d'environnement
Vérifier que le fichier `src/environments/environment.ts` pointe vers le domaine d'API officiel sécurisé :
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.catheo.org/api/v1',
  appName: 'Cathéo Super Admin',
  storagePrefix: 'catheo_',
  sessionTimeoutMinutes: 60,
};
```

### 1.3. Génération du bundle
```bash
npm run build
```
Les fichiers statiques optimisés sont générés dans :
`dist/catheo-super-admin/browser/`

---

## 2. Déploiement sur Serveur Web (Nginx)

### 2.1. Copie des fichiers
Transférer le contenu du dossier `dist/catheo-super-admin/browser/` vers le répertoire web du serveur de production :
```bash
scp -r dist/catheo-super-admin/browser/* deploy@serveur.catheo.org:/var/www/catheo-admin/
```

### 2.2. Configuration Nginx Recommandée
Une application monopage (SPA) Angular nécessite que toutes les requêtes d'URL directes soient réécrites vers `index.html` :

```nginx
server {
    listen 80;
    server_name admin.catheo.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.catheo.org;

    ssl_certificate /etc/letsencrypt/live/admin.catheo.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.catheo.org/privkey.pem;

    root /var/www/catheo-admin;
    index index.html;

    # En-têtes de sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; font-src 'self' https://cdn.jsdelivr.net; img-src 'self' data: https:; connect-src 'self' https://api.catheo.org;" always;

    # Compression Gzip / Brotli
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml application/json application/javascript application/xml+rss application/atom+xml image/svg+xml;

    # Gestion du cache des assets versionnés
    location ~* \.(?:ico|css|js|gif|jpe?g|png|woff2?|eot|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Redirection SPA vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## 3. Configuration Apache (.htaccess)

Si le déploiement est effectué sous un serveur Apache (ex. cPanel ou environnement XAMPP de production) :
Créer un fichier `.htaccess` à la racine de `/var/www/catheo-admin/` :
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 4. Sécurité & HTTPS

- **Certificat SSL :** Déploiement obligatoire d'un certificat TLS valide (Let's Encrypt ou Certificat d'Autorité).
- **CORS :** L'API Laravel backend doit autoriser l'origine `https://admin.catheo.org` dans son fichier `config/cors.php` avec support des credentials (`supports_credentials: true`).
- **Cookies Sanctum :** En cas d'utilisation de cookies de session Sanctum, vérifier que le domaine racine correspond ou que le Bearer Token est bien transmis par l'en-tête `Authorization`.

---

## 5. Vérifications Post-Déploiement

Exécuter la séquence de contrôle immédiate après mise en ligne :
1. **Accès initial :** Charger `https://admin.catheo.org` → Redirection attendue vers `/auth/organisation`.
2. **Rafraîchissement direct (F5) :** Accéder directement à `https://admin.catheo.org/auth/admin` et rafraîchir la page (vérifie l'absence de 404 Nginx).
3. **Connexion Super Admin :** Se connecter avec le compte Super Admin de recette → Accès au Dashboard global.
4. **Connexion Organisation :**
   - Tester la connexion avec un compte OPPE en sélectionnant `[ OPPE ]` → Connexion réussie.
   - Tester la connexion avec le même compte en sélectionnant `[ OPPJ ]` → Refus immédiat avec message `SPACE_MISMATCH`.
5. **Exports & Impression :**
   - Télécharger un export CSV de membres ou d'opérations de caisse → Fichier généré avec BOM UTF-8 sans erreur.
   - Déclencher une impression navigateur (Ctrl + P) → Aperçu propre sans éléments d'interface parasite.
