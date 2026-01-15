# NexusStore - Marketplace Apps Android & PWA

NexusStore est une marketplace web indépendante permettant aux développeurs de publier leurs applications Android (APK/AAB) et PWA, et aux utilisateurs de les télécharger.

## Stack Technique

### Frontend
- HTML5, CSS3, JavaScript ES6+ (vanilla)
- Architecture SPA (Single Page Application)
- Design system sombre avec accent vert (#c8ff00)

### Backend
- Node.js 18+ avec Express.js
- PostgreSQL 14+
- JWT pour l'authentification
- Stripe pour les paiements

## Structure du Projet

```
nexusstore/
├── index.html              # Point d'entrée frontend
├── css/                    # Styles CSS modulaires
│   ├── variables.css       # Variables CSS
│   ├── reset.css           # Reset CSS
│   ├── base.css            # Styles de base
│   ├── components.css      # Composants UI
│   ├── layout.css          # Mise en page
│   └── responsive.css      # Responsive design
├── js/                     # JavaScript frontend
│   ├── app.js              # Application principale
│   ├── state.js            # Gestion d'état
│   ├── router.js           # Navigation SPA
│   ├── api.js              # Appels API
│   ├── icons.js            # Icônes SVG
│   ├── components/         # Composants UI
│   └── pages/              # Pages de l'application
├── api/                    # Backend Node.js
│   ├── src/
│   │   ├── index.js        # Serveur Express
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Middlewares
│   │   ├── routes/         # Routes API
│   │   ├── controllers/    # Contrôleurs
│   │   └── utils/          # Utilitaires
│   ├── schema.sql          # Schéma BDD
│   └── package.json
└── uploads/                # Fichiers uploadés
```

## Installation

### Prérequis
- Node.js 18+
- PostgreSQL 14+
- npm ou yarn

### Frontend

```bash
# Servir les fichiers statiques
cd nexusstore
npx serve .
# ou
python -m http.server 3000
```

### Backend

```bash
# Installation des dépendances
cd nexusstore/api
npm install

# Configuration
cp .env.example .env
# Éditer .env avec vos paramètres

# Base de données
createdb nexusstore
psql -d nexusstore -f schema.sql
# ou
npm run db:migrate

# Données de test
npm run db:seed

# Démarrage
npm run dev     # Développement
npm start       # Production
```

## Configuration

Créez un fichier `.env` dans le dossier `api/` :

```env
# Serveur
NODE_ENV=development
PORT=3001

# Base de données PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexusstore
DB_USER=nexusstore_user
DB_PASSWORD=votre_mot_de_passe

# JWT
JWT_SECRET=votre_secret_jwt_32_caracteres_minimum
JWT_EXPIRES_IN=7d

# Stockage
UPLOAD_DIR=./uploads
APPS_DIR=./uploads/apps
MAX_FILE_SIZE=104857600

# Stripe
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Frontend
FRONTEND_URL=http://localhost:3000
```

## API Endpoints

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Utilisateur courant

### Applications
- `GET /api/apps` - Liste des apps (+ filtres)
- `GET /api/apps/:id` - Détail d'une app
- `POST /api/apps` - Créer une app (auth)
- `PUT /api/apps/:id` - Modifier une app (auth)
- `DELETE /api/apps/:id` - Supprimer une app (auth)
- `GET /api/apps/:id/download` - Télécharger une app

### Upload
- `POST /api/upload/app/:appId` - Upload fichier APK/AAB/ZIP
- `POST /api/upload/icon/:appId` - Upload icône
- `POST /api/upload/screenshots/:appId` - Upload screenshots

### Paiements
- `POST /api/checkout` - Créer session Stripe
- `POST /api/checkout/webhook` - Webhook Stripe

## Comptes de Démo

Après avoir exécuté `npm run db:seed` :

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@nexusstore.com | admin123 |
| Développeur | dev@nexusstore.com | developer123 |
| Utilisateur | user@nexusstore.com | user123 |

## Design System

### Couleurs
```css
--bg-primary: #0a0a0a;
--bg-secondary: #141414;
--bg-tertiary: #1a1a1a;
--border: #2a2a2a;
--accent: #c8ff00;
--text-primary: #ffffff;
--text-secondary: #888888;
--text-muted: #666666;
```

### Icônes
Toutes les icônes sont en SVG inline avec stroke (pas de fill).

## Déploiement

### Production avec PM2
```bash
cd api
npm install --production
pm2 start src/index.js --name nexusstore-api
```

### Nginx (reverse proxy)
```nginx
server {
    listen 443 ssl;
    server_name api.nexusstore.example.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Licence

MIT
