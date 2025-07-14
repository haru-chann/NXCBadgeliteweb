# NXC Badge Lite - Digital Business Card Platform

## Overview

NXC Badge Lite is a modern digital business card and networking platform built with a React + Express full-stack architecture. The application enables users to create digital profiles that can be shared via NFC tags, QR codes, or direct links, facilitating seamless professional networking.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack React Query for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized builds
- **PWA Support**: Service worker implementation for offline functionality

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful API design with Firebase integration
- **Database ORM**: Drizzle ORM for PostgreSQL + Firebase Firestore
- **Authentication**: Dual support - Replit Auth (OIDC) and Firebase Auth (Google)
- **Session Management**: PostgreSQL-backed sessions + Firebase Auth tokens
- **Real-time**: Firebase Firestore real-time subscriptions
- **Push Notifications**: Firebase Cloud Messaging (FCM)
- **Cloud Functions**: Firebase Functions for serverless operations

### Database Architecture
- **Primary Database**: PostgreSQL (Neon serverless) for core operations
- **Real-time Database**: Firebase Firestore for live features
- **Schema Management**: Drizzle migrations for PostgreSQL
- **Connection**: Neon serverless with WebSocket support + Firebase SDK
- **Offline Support**: Firestore offline persistence for mobile users

## Key Components

### Authentication System
- **Provider**: Replit Auth with OIDC integration
- **Session Storage**: PostgreSQL sessions table
- **User Management**: Automatic user upsert on authentication
- **Security**: HTTP-only cookies with secure flag

### Profile Management
- **Digital Business Cards**: Comprehensive profile creation with business information
- **Social Links**: Support for LinkedIn, GitHub, Twitter, Instagram, WhatsApp
- **NFC Integration**: NFC tag writing and reading capabilities
- **QR Code Support**: Fallback scanning method for devices without NFC

### Networking Features
- **Connection Tracking**: Save and manage professional connections
- **Profile Views**: Analytics on who viewed your profile
- **Favorites System**: Mark important connections
- **Analytics Dashboard**: View metrics on profile engagement

### User Interface
- **Design System**: Dark theme with gold (#FFD700) and electric blue (#1E90FF) accents
- **Typography**: Poppins font family for modern appearance
- **Mobile-First**: Responsive design with bottom navigation
- **Components**: Comprehensive UI component library with shadcn/ui
- **Accessibility**: ARIA-compliant components and keyboard navigation

## Data Flow

### Authentication Flow
1. User initiates login through Replit Auth
2. OIDC provider authenticates and returns tokens
3. User session stored in PostgreSQL
4. Client receives authentication state via API

### Profile Creation Flow
1. Authenticated user creates/updates profile via form
2. Profile data validated with Zod schemas
3. Stored in PostgreSQL with Drizzle ORM
4. Real-time updates via React Query cache invalidation

### Connection Flow
1. User scans NFC tag or QR code
2. Profile lookup via NFC tag ID or direct link
3. Connection record created with scan method tracking
4. Analytics updated for both users

### Analytics Flow
1. Profile views tracked with device/browser information
2. Connection statistics aggregated in real-time
3. Professional insights generated from viewer data
4. Export functionality for data portability

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL serverless connection
- **drizzle-orm**: Type-safe database operations
- **@tanstack/react-query**: Server state management
- **@radix-ui/**: Accessible UI primitives
- **wouter**: Lightweight React router

### Firebase Dependencies
- **firebase**: Client-side Firebase SDK for web
- **firebase-admin**: Server-side Firebase Admin SDK
- **@firebase/messaging**: Push notifications client
- **@firebase/firestore**: Real-time database client
- **@firebase/auth**: Authentication client

### Development Dependencies
- **Vite**: Build tool and dev server
- **TypeScript**: Type safety and development experience
- **Tailwind CSS**: Utility-first styling
- **ESBuild**: Fast bundling for production

### Authentication Dependencies
- **openid-client**: OIDC authentication (Replit)
- **passport**: Authentication middleware
- **express-session**: Session management
- **connect-pg-simple**: PostgreSQL session store
- **firebase/auth**: Google authentication via Firebase

## Deployment Strategy

### Build Process
1. **Client Build**: Vite compiles React app to static assets
2. **Server Build**: ESBuild bundles Express server with external packages
3. **Output**: Unified dist directory with public assets and server bundle

### Environment Configuration
- **Development**: Hot module replacement with Vite dev server
- **Production**: Static file serving with Express
- **Database**: Environment-based connection strings
- **Sessions**: Configurable session secrets and TTL

### Hosting Requirements
- **Node.js**: Runtime environment
- **PostgreSQL**: Database with session table support
- **HTTPS**: Required for secure cookies and NFC functionality
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, REPL_ID

### Progressive Web App
- **Manifest**: Configured for mobile installation
- **Service Worker**: Offline caching and background sync
- **Icons**: Multiple sizes for various devices
- **Theme**: Consistent branding across platforms

### Error Handling
- **Client**: Global error boundaries and toast notifications
- **Server**: Centralized error middleware with proper HTTP status codes
- **Database**: Connection retry logic and graceful degradation
- **Authentication**: Automatic redirect to login on session expiry