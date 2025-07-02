# SplitWise - Local Setup Guide

## Prerequisites

Before setting up the application locally, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **PostgreSQL** (version 12 or higher)
- **Git** (to clone the repository)

## Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd splitwise-expense-tracker
```

## Step 2: Install Dependencies

```bash
npm install
```

This will install all the required dependencies for both frontend and backend.

## Step 3: Database Setup

### Option A: Local PostgreSQL Installation

1. **Install PostgreSQL:**
   - **Windows:** Download from [postgresql.org](https://www.postgresql.org/download/windows/)
   - **macOS:** Use Homebrew: `brew install postgresql`
   - **Ubuntu/Debian:** `sudo apt-get install postgresql postgresql-contrib`

2. **Start PostgreSQL service:**
   - **Windows:** PostgreSQL should start automatically
   - **macOS:** `brew services start postgresql`
   - **Ubuntu/Debian:** `sudo systemctl start postgresql`

3. **Create a database:**
   ```bash
   # Access PostgreSQL as superuser
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE splitwise_db;
   CREATE USER splitwise_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE splitwise_db TO splitwise_user;
   \q
   ```

### Option B: Docker PostgreSQL (Recommended for Development)

```bash
# Create and run PostgreSQL container
docker run --name splitwise-postgres \
  -e POSTGRES_DB=splitwise_db \
  -e POSTGRES_USER=splitwise_user \
  -e POSTGRES_PASSWORD=your_password \
  -p 5432:5432 \
  -d postgres:15
```

### Option C: Cloud Database (Neon, Supabase, etc.)

1. Create a free PostgreSQL database on [Neon](https://neon.tech/), [Supabase](https://supabase.com/), or [ElephantSQL](https://www.elephantsql.com/)
2. Get your connection string from the provider

## Step 4: Environment Configuration

1. **Create environment variables:**
   Create a `.env` file in the root directory:

   ```env
   # Database Configuration
   DATABASE_URL=postgresql://splitwise_user:your_password@localhost:5432/splitwise_db
   
   # Alternative format for individual components
   PGHOST=localhost
   PGPORT=5432
   PGUSER=splitwise_user
   PGPASSWORD=your_password
   PGDATABASE=splitwise_db
   
   # Application Configuration
   NODE_ENV=development
   PORT=5000
   ```

2. **For cloud databases, use the provided connection string:**
   ```env
   DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
   ```

## Step 5: Database Schema Setup

Run the database migration to create the required tables:

```bash
npm run db:push
```

This command will:
- Create the `expenses` table with all necessary columns
- Set up proper indexes and constraints
- Apply any schema changes

## Step 6: Seed Sample Data (Optional)

To populate the database with sample data for testing:

```bash
# Connect to your database and run:
psql $DATABASE_URL

# Insert sample data
INSERT INTO expenses (id, amount, description, paid_by, split_with, split_type, category, created_at, updated_at) VALUES
(gen_random_uuid(), '1200', 'Dinner at Italian Restaurant', 'Shantanu', ARRAY['Sanket', 'Om'], 'equal', 'Food', NOW(), NOW()),
(gen_random_uuid(), '3000', 'Uber to Airport', 'Sanket', ARRAY['Shantanu', 'Om'], 'equal', 'Travel', NOW(), NOW()),
(gen_random_uuid(), '800', 'Movie Tickets', 'Om', ARRAY['Shantanu', 'Sanket'], 'equal', 'Entertainment', NOW(), NOW()),
(gen_random_uuid(), '1500', 'Electricity Bill', 'Shantanu', ARRAY['Sanket', 'Om'], 'equal', 'Utilities', NOW(), NOW()),
(gen_random_uuid(), '2500', 'Groceries for Party', 'Sanket', ARRAY['Shantanu', 'Om'], 'equal', 'Food', NOW(), NOW()),
(gen_random_uuid(), '600', 'Coffee and Snacks', 'Om', ARRAY['Shantanu'], 'equal', 'Food', NOW(), NOW());
```

## Step 7: Start the Application

```bash
# Start the development server
npm run dev
```

This will start:
- **Backend API server** on http://localhost:5000
- **Frontend development server** on http://localhost:5173 (with proxy to backend)

## Step 8: Verify Installation

1. **Check API Health:**
   ```bash
   curl http://localhost:5000/api/expenses
   ```

2. **Access Frontend:**
   Open http://localhost:5173 in your browser

3. **Test Core Features:**
   - View existing expenses
   - Add a new expense
   - Check balances and settlements
   - View analytics

## Available NPM Scripts

```bash
# Development
npm run dev          # Start development servers (frontend + backend)

# Database
npm run db:push      # Push schema changes to database
npm run db:generate  # Generate migration files

# Build
npm run build        # Build for production
npm start           # Start production server
```

## Project Structure

```
splitwise-expense-tracker/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # UI components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities and API client
│   │   └── hooks/         # Custom React hooks
├── server/                # Backend Express application
│   ├── index.ts          # Main server file
│   ├── routes.ts         # API routes
│   ├── storage.ts        # Database operations
│   └── db.ts             # Database connection
├── shared/                # Shared types and schemas
│   └── schema.ts         # Database schema and types
└── package.json          # Dependencies and scripts
```

## API Endpoints

The application provides the following REST API endpoints:

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create new expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/people` - Get all people
- `GET /api/balances` - Get current balances
- `GET /api/settlements` - Get settlement recommendations
- `GET /api/dashboard-stats` - Get dashboard statistics
- `GET /api/analytics` - Get analytics data

## Troubleshooting

### Database Connection Issues

1. **Check if PostgreSQL is running:**
   ```bash
   # macOS/Linux
   ps aux | grep postgres
   
   # Windows
   services.msc (look for PostgreSQL service)
   ```

2. **Verify connection string:**
   ```bash
   # Test connection
   psql $DATABASE_URL
   ```

3. **Check firewall/port access:**
   Ensure port 5432 is not blocked by firewall

### Application Issues

1. **Port already in use:**
   ```bash
   # Kill process using port 5000
   lsof -ti:5000 | xargs kill -9
   ```

2. **Module not found errors:**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Database schema errors:**
   ```bash
   # Reset and recreate schema
   npm run db:push
   ```

### Frontend Issues

1. **API calls failing:**
   - Check if backend is running on port 5000
   - Verify CORS settings
   - Check browser network tab for errors

2. **Build errors:**
   ```bash
   # Clear Vite cache
   rm -rf node_modules/.vite
   npm run dev
   ```

## Development Tips

1. **Use database GUI tools:**
   - [pgAdmin](https://www.pgadmin.org/) for full database management
   - [TablePlus](https://tableplus.com/) for lightweight access
   - [DBeaver](https://dbeaver.io/) for cross-platform use

2. **API Testing:**
   - Use the provided Postman collection
   - Or use curl/HTTPie for command-line testing
   - Browser DevTools for frontend debugging

3. **Code Quality:**
   - The project uses TypeScript for type safety
   - ESLint and Prettier configurations are included
   - Run `npm run build` to check for TypeScript errors

## Need Help?

If you encounter any issues:

1. Check this troubleshooting section
2. Verify all prerequisites are installed correctly
3. Ensure your database is properly configured and accessible
4. Check the console for detailed error messages

The application uses modern web technologies and follows best practices for both development and production deployment.