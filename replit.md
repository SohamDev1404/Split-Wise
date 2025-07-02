# SplitWise - Expense Tracker

## Overview

SplitWise is a production-ready expense tracker application similar to Splitwise, designed to help groups split expenses fairly and calculate optimized settlements. The application automatically tracks people mentioned in expenses and provides smart algorithms to minimize the number of transactions needed for settlements.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend:

- **Frontend**: React with TypeScript, built with Vite
- **Backend**: Node.js with Express.js REST API
- **Database**: PostgreSQL with Drizzle ORM
- **Deployment**: Replit platform
- **Styling**: Tailwind CSS with shadcn/ui components

## Key Components

### Backend Architecture

**Server Structure**
- `server/index.ts`: Main Express server with middleware setup and route registration
- `server/routes.ts`: API route definitions with comprehensive error handling
- `server/storage.ts`: Data access layer implementing the IStorage interface
- `server/db.ts`: Database connection and Drizzle ORM configuration
- `server/vite.ts`: Development server setup with Vite integration

**Database Schema**
- Single `expenses` table with UUID primary keys
- Supports multiple split types: equal, percentage, and exact amounts
- JSON field for storing complex split details
- Automatic timestamp tracking for created/updated records

**API Design**
- RESTful endpoints following standard conventions
- Comprehensive error handling with Zod validation
- Consistent response format with success/error status
- Support for CRUD operations on expenses and analytics

### Frontend Architecture

**Component Structure**
- Modular component design using shadcn/ui primitives
- Custom business logic components for expense management
- Responsive design with mobile-first approach
- Form handling with React Hook Form and Zod validation

**State Management**
- TanStack Query for server state management
- Automatic cache invalidation on mutations
- Optimistic updates for better user experience
- Toast notifications for user feedback

**Routing**
- Wouter for lightweight client-side routing
- Single-page dashboard application
- Modal-based forms for expense management

### Settlement Algorithm

The application implements a greedy algorithm for optimal settlement calculations:
1. Calculate net balance for each person (paid - owed)
2. Separate creditors (positive balance) and debtors (negative balance)
3. Match largest creditor with largest debtor
4. Settle minimum of their absolute balances
5. Repeat until all balances are settled

This approach minimizes the total number of transactions required.

## Data Flow

1. **Expense Creation**: Form submission → Validation → Database insertion → Cache invalidation
2. **Balance Calculation**: Real-time computation from expense data → Settlement optimization
3. **Dashboard Updates**: Automatic refresh of statistics, balances, and recommendations
4. **Person Tracking**: Automatic creation of person records when mentioned in expenses

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: PostgreSQL connection with serverless support
- **drizzle-orm**: Type-safe database ORM with schema migrations
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI primitives for components

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across frontend and backend
- **Tailwind CSS**: Utility-first styling framework
- **Zod**: Runtime type validation and schema definition

### Database Connection
- Uses Neon serverless PostgreSQL with WebSocket support
- Environment-based configuration via DATABASE_URL
- Connection pooling for production performance

## Deployment Strategy

**Replit Configuration**
- Single repository deployment with both frontend and backend
- Vite integration for development mode with HMR
- Production build process combines frontend assets with Express server
- Environment variable management for database connections

**Build Process**
1. Frontend: Vite builds React app to `dist/public`
2. Backend: esbuild bundles Node.js server to `dist/index.js`
3. Static assets served from Express in production
4. Development mode uses Vite middleware integration

**Database Management**
- Drizzle Kit for schema migrations
- Push-based deployment with `db:push` command
- Schema definitions shared between frontend and backend

## Changelog

- July 02, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.