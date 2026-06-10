# Table Tennis Tournament - Frontend

A modern React application for managing table tennis tournaments, built with React 18, Vite, and Tailwind CSS v4.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Development](#development)
- [Building for Production](#building-for-production)
- [Environment Variables](#environment-variables)
- [Component Architecture](#component-architecture)
- [API Integration](#api-integration)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This is the frontend application for the Table Tennis Tournament Management System. It provides a user-friendly interface for managing players, teams, matches, and viewing statistics.

## ✨ Features

- **Player Management**: Add, edit, and manage players with expertise levels
- **Team Management**: Create teams with smart pairing (one Intermediate + one Expert)
- **Tournament View**: Flexible group stage, standings, knockout bracket (`/tournament`)
- **Match Management**: Schedule matches and record results
- **Statistics Dashboard**: Per-group standings and knockout summaries
- **Admin Reset**: Clear tournament data while keeping user accounts
- **Authentication**: Secure login system
- **Responsive Design**: Works on desktop and mobile devices
- **Modern UI**: Built with Tailwind CSS v4

## 🛠 Tech Stack

- **React 18** - UI library
- **React Router DOM** - Routing
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Axios** - HTTP client
- **ES Modules** - Modern JavaScript

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/          # React components
│   │   ├── atoms/          # Basic building blocks (Button, Input, Card, etc.)
│   │   ├── molecules/      # Combined components (PlayerCard, TeamCard, etc.)
│   │   └── templates/      # Page layouts (Layout)
│   ├── contexts/           # React contexts (AuthContext)
│   ├── pages/              # Route pages
│   │   ├── HomePage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── PlayersPage.jsx
│   │   ├── TeamsPage.jsx
│   │   ├── MatchesPage.jsx
│   │   ├── TournamentPage.jsx
│   │   └── StatisticsPage.jsx
│   ├── services/          # API service functions
│   │   ├── authService.js
│   │   ├── playerService.js
│   │   ├── teamService.js
│   │   ├── matchService.js
│   │   ├── tournamentService.js
│   │   ├── adminService.js
│   │   ├── statisticsService.js
│   │   └── seedService.js
│   ├── utils/             # Utility functions
│   │   └── api.js         # Axios instance and interceptors
│   ├── App.jsx            # Main app component
│   ├── main.jsx           # Entry point
│   └── index.css          # Global styles
├── index.html             # HTML template
├── vite.config.js         # Vite configuration
├── postcss.config.js      # PostCSS configuration
└── package.json           # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Backend API running (see [Backend README](../backend/README.md))

### Installation

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create environment file:**
   ```bash
   # Create .env file
   echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env
   ```

4. **Start development server:**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5173`

## 💻 Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |

### Development Server

The development server runs on port `5173` by default. It includes:
- Hot Module Replacement (HMR)
- Fast refresh
- Source maps
- Error overlay

### Code Structure

The application follows **Atomic Design Pattern**:

- **Atoms**: Basic, reusable components (Button, Input, Badge, Card, Select)
- **Molecules**: Combinations of atoms (PlayerCard, TeamCard, MatchCard, Forms)
- **Templates**: Page layouts (Layout with Navigation)

## 🏗 Building for Production

### Build Command

```bash
npm run build
```

This creates an optimized production build in the `dist/` directory.

### Build Output

- **dist/index.html** - Entry HTML file
- **dist/assets/** - Optimized JavaScript and CSS files
- **dist/** - Static assets

### Preview Production Build

```bash
npm run preview
```

This serves the production build locally for testing.

### Deployment

The `dist/` folder contains static files that can be deployed to:
- **Static hosting**: Netlify, Vercel, GitHub Pages
- **CDN**: CloudFlare, AWS CloudFront
- **Web server**: Nginx, Apache

**Example Nginx configuration:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

## 🔧 Environment Variables

Create a `.env` file in the `frontend/` directory:

```env
# API Base URL
VITE_API_BASE_URL=http://localhost:3000/api
```

**Important:**
- Variables must be prefixed with `VITE_` to be accessible in the app
- Access in code: `import.meta.env.VITE_API_BASE_URL`
- Restart dev server after changing `.env` file

## 🧩 Component Architecture

### Atomic Design Pattern

The application uses Atomic Design for component organization:

1. **Atoms** (`src/components/atoms/`)
   - Basic, indivisible components
   - Examples: Button, Input, Badge, Card, Select
   - Highly reusable

2. **Molecules** (`src/components/molecules/`)
   - Combinations of atoms
   - Examples: PlayerCard, TeamCard, MatchCard, Forms
   - Form specific functionality

3. **Templates** (`src/components/templates/`)
   - Page layouts
   - Example: Layout (includes Navigation)

### Component Example

```jsx
// Atom: Button
import Button from './components/atoms/Button';

<Button onClick={handleClick} variant="primary">
  Click Me
</Button>

// Molecule: PlayerCard
import PlayerCard from './components/molecules/PlayerCard';

<PlayerCard 
  player={player} 
  onEdit={handleEdit}
  onDelete={handleDelete}
/>
```

## 🔌 API Integration

### API Client Setup

The application uses Axios for API calls, configured in `src/utils/api.js`:

```javascript
import api from './utils/api';

// GET request
const players = await api.get('/players');

// POST request
const newPlayer = await api.post('/players', playerData);

// PUT request
await api.put(`/players/${id}`, updatedData);

// DELETE request
await api.delete(`/players/${id}`);
```

### Service Functions

API calls are organized in service files (`src/services/`):

- `authService.js` - Authentication
- `playerService.js` - Player operations
- `teamService.js` - Team operations
- `matchService.js` - Match operations
- `tournamentService.js` - Tournament overview & setup
- `adminService.js` - Application reset
- `statisticsService.js` - Statistics
- `seedService.js` - Database seeding

### Error Handling

API errors are handled globally through Axios interceptors in `src/utils/api.js`.

## 🎨 Styling

### Tailwind CSS v4

The application uses Tailwind CSS v4 with a CSS-based configuration:

- Configuration: `src/index.css`
- PostCSS: `postcss.config.js`
- Utility-first approach
- Custom theme configuration

### Custom Styles

Global styles and Tailwind directives are in `src/index.css`:

```css
@import "tailwindcss";

@theme {
  /* Custom theme variables */
}
```

## 🔐 Authentication

The app includes authentication using React Context:

- **AuthContext** (`src/contexts/AuthContext.jsx`) - Manages auth state
- **LoginPage** - Login form
- **Protected Routes** - Routes that require authentication

## 📱 Pages

| Page | Route | Description |
|------|-------|-------------|
| Home | `/` | Dashboard with overview statistics |
| Login | `/login` | User authentication |
| Players | `/players` | Player management |
| Teams | `/teams` | Team management |
| Matches | `/matches` | Match scheduling and results |
| Tournament | `/tournament` | Group standings, fixtures, knockout bracket |
| Statistics | `/statistics` | Statistics dashboard |

## 🐛 Troubleshooting

### Port Already in Use

If port 5173 is already in use:

```bash
# Kill process on port 5173 (Linux/Mac)
lsof -ti:5173 | xargs kill

# Or change port in vite.config.js
```

### API Connection Errors

1. **Check backend is running:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Verify API URL in `.env`:**
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   ```

3. **Check CORS settings** in backend

### Build Errors

1. **Clear cache and rebuild:**
   ```bash
   rm -rf node_modules dist
   npm install
   npm run build
   ```

2. **Check Node.js version:**
   ```bash
   node --version  # Should be v18+
   ```

### Module Not Found

1. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS v4 Documentation](https://tailwindcss.com/)
- [React Router Documentation](https://reactrouter.com/)

## 🤝 Contributing

When adding new features:

1. Follow Atomic Design pattern
2. Create service functions for API calls
3. Use Tailwind utilities for styling
4. Add error handling
5. Update this README if needed

## 📝 License

Part of the Table Tennis Tournament Management System.

