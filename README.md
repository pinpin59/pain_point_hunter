# Pain Point Hunter

Outil de veille automatisée qui scrape **Reddit** et **Trustpilot** pour identifier les points de douleur des utilisateurs autour d'un produit ou d'une marque.  
Les résultats sont consultables via une API REST ou exportables directement en fichier Excel structuré.

---

## Fonctionnalités

- **Scraping Reddit** — récupère les posts des flux `hot`, `new` et `top` sur une liste de subreddits, filtrés par mots-clés personnalisés
- **Scraping Trustpilot** — récupère les avis 1★ et 2★ d'une liste d'entreprises via automatisation Chromium
- **Export Excel** — génère un fichier `.xlsx` multi-onglets (tous les résultats + un onglet par source)
- **Authentification JWT** — toutes les routes de scraping sont protégées
- **Documentation Swagger** — disponible sur `/api/docs`

---

## Stack technique

### Backend (`/backend`)

| Catégorie | Lib / Outil |
|---|---|
| Framework | [NestJS 11](https://nestjs.com/) |
| Langage | TypeScript 5.7 |
| ORM | [Prisma 7](https://www.prisma.io/) avec adaptateur `pg` |
| Base de données | PostgreSQL (via Docker) |
| Validation | [Zod v4](https://zod.dev/) + [nestjs-zod v5](https://github.com/risen228/nestjs-zod) |
| Auth | JWT (`@nestjs/jwt` + `passport-jwt`) + bcrypt |
| HTTP client | [Axios](https://axios-http.com/) (Reddit OAuth2) |
| Browser automation | [Playwright](https://playwright.dev/) + Chromium (Trustpilot) |
| Export Excel | [ExcelJS](https://github.com/exceljs/exceljs) |
| Documentation API | [@nestjs/swagger](https://docs.nestjs.com/openapi/introduction) |
| Config | `@nestjs/config` + fichiers `.env.development` / `.env.production` |

### Shared (`/shared`)

Librairie interne (`@pain-point-hunter/shared`) partagée entre le backend et le frontend :
- **Schémas Zod** : `RedditPost`, `FetchSubredditsBody`, `TrustpilotReview`, `FetchTrustpilotBody`, `Auth`
- **Constantes** : liste de subreddits, mots-clés pain points (EN + FR)
- **Types utilitaires** : `ApiResponse<T>`, `PaginatedResponse<T>`

### Frontend (`/frontend`)

| Catégorie | Lib / Outil |
|---|---|
| Framework | [React 19](https://react.dev/) |
| Build tool | [Vite](https://vitejs.dev/) |
| Langage | TypeScript |

---

## Prérequis

- **Node.js** >= 20
- **Docker** (pour la base de données PostgreSQL)
- **npm** >= 10 (workspaces)

---

## Installation

```bash
# Cloner le projet
git clone <url-du-repo>
cd pain_point_hunter

# Installer toutes les dépendances (root + backend + frontend + shared)
npm install

# Installer le navigateur Chromium pour Playwright (nécessaire pour le scraping Trustpilot)
cd backend && npx playwright install chromium && cd ..
```

---

## Configuration

Créer le fichier `backend/.env.development` :

```env
# Base de données
DATABASE_URL="postgresql://user:password@localhost:5432/pain_point_hunter"

# JWT
JWT_SECRET=your_jwt_secret

# Reddit OAuth2 (https://www.reddit.com/prefs/apps)
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=PainPointScraper/1.0
```

---

## Lancer le projet

### Base de données

```bash
# Démarrer PostgreSQL via Docker
npm run db:up

# Appliquer les migrations Prisma
npm run db:migrate
```

### Développement (tout en parallèle)

```bash
npm run dev
```

Lance simultanément :
- `shared` en watch mode (compilation TypeScript)
- `backend` sur **http://localhost:3000**
- `frontend` sur **http://localhost:5173**

### Backend seul

```bash
npm run dev --workspace=backend
```

### Production

```bash
npm run build
npm run start
```

---

## API

La documentation interactive Swagger est disponible sur :

```
http://localhost:3000/api/docs
```

### Endpoints principaux

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte |
| `POST` | `/auth/login` | Obtenir un token JWT |
| `GET` | `/reddit/subreddits` | Liste des subreddits disponibles |
| `POST` | `/reddit/posts` | Scraper Reddit (JSON) |
| `POST` | `/reddit/export` | Scraper Reddit → fichier Excel |
| `POST` | `/trustpilot/reviews` | Scraper Trustpilot (JSON) |
| `POST` | `/trustpilot/export` | Scraper Trustpilot → fichier Excel |

> Toutes les routes sauf `/auth/*` requièrent un header `Authorization: Bearer <token>`.

### Exemple — Scraping Reddit

```json
POST /reddit/posts
{
  "subreddits": ["SaaS", "Entrepreneur"],
  "keywords": ["frustrating", "broken", "support is terrible"],
  "limit": 25
}
```

### Exemple — Scraping Trustpilot

```json
POST /trustpilot/reviews
{
  "companies": ["mailchimp.com", "hubspot.com"],
  "maxPages": 3
}
```

> Le slug Trustpilot correspond au **nom de domaine** de l'entreprise (ex: `mailchimp.com`, pas `mailchimp`).

---

## Scripts utiles

| Commande | Description |
|---|---|
| `npm run dev` | Lance tout en mode développement |
| `npm run build` | Build complet (shared → backend → frontend) |
| `npm run db:up` | Démarre PostgreSQL (Docker) |
| `npm run db:down` | Arrête PostgreSQL (Docker) |
| `npm run db:migrate` | Applique les migrations Prisma |
| `npm run db:studio` | Ouvre Prisma Studio |
| `npm run test` | Lance les tests backend |

---

## Déploiement (production)

Le projet inclut un `Dockerfile` à la racine basé sur l'image officielle **`mcr.microsoft.com/playwright`**, qui embarque Chromium et toutes ses dépendances système — aucune installation manuelle nécessaire sur le serveur.

### Avec Docker Compose (VPS, serveur dédié)

Créer un fichier `.env` à la racine avec les variables de production :

```env
JWT_SECRET=your_jwt_secret
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USER_AGENT=PainPointScraper/1.0
```

Puis lancer :

```bash
docker compose up -d
```

Cela démarre :
- **PostgreSQL** sur le port `5432`
- **Backend NestJS** sur le port `3000` (avec Chromium inclus dans l'image)

### Plateformes cloud (Railway, Render, Fly.io...)

Ces plateformes détectent automatiquement le `Dockerfile` à la racine. Il suffit de renseigner les variables d'environnement dans leur interface et de déployer. Chromium est déjà dans l'image, aucune configuration supplémentaire n'est nécessaire.
