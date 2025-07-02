# Database Connection Guide

This guide provides detailed instructions for setting up and connecting to a PostgreSQL database for the SplitWise Expense Tracker application.

## Database Requirements

- **PostgreSQL** version 12 or higher
- **Connection pooling** support
- **SSL/TLS** support for production environments
- **UUID** extension support (for primary keys)

## Connection Options

### Option 1: Neon Database (Recommended for Production)

Neon provides a serverless PostgreSQL database with excellent performance and automatic scaling.

1. **Create Account:**
   - Visit [https://neon.tech/](https://neon.tech/)
   - Sign up for a free account
   - Create a new project

2. **Get Connection Details:**
   - Navigate to your project dashboard
   - Copy the connection string from the "Connection Details" section
   - Example: `postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require`

3. **Configure Environment:**
   ```env
   DATABASE_URL=postgresql://user:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Option 2: Supabase Database

Supabase provides a PostgreSQL database with additional features like real-time subscriptions.

1. **Create Project:**
   - Visit [https://supabase.com/](https://supabase.com/)
   - Create a new project
   - Wait for the database to be provisioned

2. **Get Connection String:**
   - Go to Settings > Database
   - Copy the connection string from the "Connection parameters" section
   - Example: `postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres`

3. **Configure Environment:**
   ```env
   DATABASE_URL=postgresql://postgres:password@db.abcdefghijklmnop.supabase.co:5432/postgres
   ```

### Option 3: Local PostgreSQL

For development and testing purposes, you can run PostgreSQL locally.

#### Windows Installation

1. **Download PostgreSQL:**
   - Visit [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
   - Download the installer
   - Run the installer and follow the setup wizard

2. **Configuration:**
   - Set a password for the postgres superuser
   - Note the port (default: 5432)
   - Install pgAdmin for database management

3. **Create Database:**
   ```sql
   -- Connect to PostgreSQL as postgres user
   psql -U postgres
   
   -- Create database and user
   CREATE DATABASE splitwise_db;
   CREATE USER splitwise_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE splitwise_db TO splitwise_user;
   ALTER USER splitwise_user CREATEDB;
   \q
   ```

4. **Connection String:**
   ```env
   DATABASE_URL=postgresql://splitwise_user:your_secure_password@localhost:5432/splitwise_db
   ```

#### macOS Installation

1. **Using Homebrew:**
   ```bash
   # Install PostgreSQL
   brew install postgresql@15
   
   # Start PostgreSQL service
   brew services start postgresql@15
   
   # Create database
   createdb splitwise_db
   ```

2. **Using Postgres.app:**
   - Download from [https://postgresapp.com/](https://postgresapp.com/)
   - Install and start the application
   - Create a new server if needed

3. **Database Setup:**
   ```bash
   # Connect to PostgreSQL
   psql postgres
   
   # Create user and database
   CREATE USER splitwise_user WITH PASSWORD 'your_secure_password';
   CREATE DATABASE splitwise_db OWNER splitwise_user;
   ALTER USER splitwise_user CREATEDB;
   \q
   ```

#### Linux Installation

1. **Ubuntu/Debian:**
   ```bash
   # Update package list
   sudo apt update
   
   # Install PostgreSQL
   sudo apt install postgresql postgresql-contrib
   
   # Start service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

2. **CentOS/RHEL:**
   ```bash
   # Install PostgreSQL
   sudo yum install postgresql-server postgresql-contrib
   
   # Initialize database
   sudo postgresql-setup initdb
   
   # Start service
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

3. **Database Setup:**
   ```bash
   # Switch to postgres user
   sudo -u postgres psql
   
   # Create database and user
   CREATE DATABASE splitwise_db;
   CREATE USER splitwise_user WITH PASSWORD 'your_secure_password';
   GRANT ALL PRIVILEGES ON DATABASE splitwise_db TO splitwise_user;
   ALTER USER splitwise_user CREATEDB;
   \q
   ```

### Option 4: Docker PostgreSQL

Perfect for development environments and consistent setup across different machines.

1. **Docker Setup:**
   ```bash
   # Create and run PostgreSQL container
   docker run --name splitwise-postgres \
     -e POSTGRES_DB=splitwise_db \
     -e POSTGRES_USER=splitwise_user \
     -e POSTGRES_PASSWORD=your_secure_password \
     -p 5432:5432 \
     -v splitwise_data:/var/lib/postgresql/data \
     -d postgres:15
   ```

2. **Verify Container:**
   ```bash
   # Check if container is running
   docker ps
   
   # Connect to database
   docker exec -it splitwise-postgres psql -U splitwise_user -d splitwise_db
   ```

3. **Connection String:**
   ```env
   DATABASE_URL=postgresql://splitwise_user:your_secure_password@localhost:5432/splitwise_db
   ```

## Environment Configuration

### Development Environment

Create a `.env` file in your project root:

```env
# Primary connection string
DATABASE_URL=postgresql://user:password@host:port/database

# Individual components (optional, for debugging)
PGHOST=localhost
PGPORT=5432
PGUSER=splitwise_user
PGPASSWORD=your_secure_password
PGDATABASE=splitwise_db

# Application settings
NODE_ENV=development
PORT=5000
```

### Production Environment

For production deployment, ensure your environment variables are set securely:

```env
# Use SSL for production
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Additional security settings
NODE_ENV=production
PORT=5000
```

## Connection Testing

### Using psql Command Line

```bash
# Test connection with full URL
psql $DATABASE_URL

# Test connection with individual parameters
psql -h localhost -p 5432 -U splitwise_user -d splitwise_db

# Test connection and run a query
psql $DATABASE_URL -c "SELECT version();"
```

### Using Node.js

Create a test file to verify your connection:

```javascript
// test-connection.js
const { Pool } = require('@neondatabase/serverless');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Server time:', result.rows[0].now);
    client.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  } finally {
    await pool.end();
  }
}

testConnection();
```

Run the test:
```bash
node test-connection.js
```

## Schema Setup

After establishing a connection, set up the database schema:

```bash
# Push schema to database
npm run db:push

# Verify tables were created
psql $DATABASE_URL -c "\dt"
```

## Connection Pooling

The application uses connection pooling for better performance:

```typescript
// server/db.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";

// Configure WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Create connection pool
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Maximum connections in pool
  min: 5,  // Minimum connections in pool
  idleTimeoutMillis: 30000,
});

// Initialize Drizzle ORM
export const db = drizzle({ client: pool, schema });
```

## Troubleshooting

### Common Connection Errors

1. **"Connection refused"**
   ```bash
   # Check if PostgreSQL is running
   sudo systemctl status postgresql
   
   # Check if port is open
   netstat -an | grep 5432
   ```

2. **"Authentication failed"**
   - Verify username and password
   - Check pg_hba.conf for authentication method
   - Ensure user has proper permissions

3. **"Database does not exist"**
   ```sql
   -- Create the database
   CREATE DATABASE splitwise_db;
   ```

4. **"SSL connection required"**
   - Add `?sslmode=require` to connection string
   - For development: `?sslmode=disable`

### Performance Optimization

1. **Connection Pool Settings:**
   ```typescript
   const pool = new Pool({
     connectionString: process.env.DATABASE_URL,
     max: 20,              // Adjust based on your needs
     min: 5,               // Keep some connections warm
     idleTimeoutMillis: 30000,
     connectionTimeoutMillis: 5000,
   });
   ```

2. **Database Indexes:**
   ```sql
   -- Add indexes for better query performance
   CREATE INDEX idx_expenses_paid_by ON expenses(paid_by);
   CREATE INDEX idx_expenses_created_at ON expenses(created_at);
   CREATE INDEX idx_expenses_category ON expenses(category);
   ```

### Security Best Practices

1. **Use Environment Variables:**
   - Never commit database credentials to version control
   - Use `.env` files for local development
   - Use secure secret management in production

2. **Enable SSL:**
   ```env
   DATABASE_URL=postgresql://user:pass@host:port/db?sslmode=require
   ```

3. **Restrict Database Access:**
   - Use dedicated database users with minimal permissions
   - Configure firewall rules
   - Enable connection logging

4. **Regular Backups:**
   ```bash
   # Backup database
   pg_dump $DATABASE_URL > backup.sql
   
   # Restore database
   psql $DATABASE_URL < backup.sql
   ```

## Monitoring and Maintenance

### Database Health Checks

```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('splitwise_db'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Performance Monitoring

```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
```

This guide should help you set up and maintain a robust database connection for your SplitWise application. Choose the option that best fits your deployment environment and security requirements.