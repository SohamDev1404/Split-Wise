# SplitWise - Expense Tracker Backend

A production-ready Split Expense Tracker backend API built with Node.js, Express, and PostgreSQL. Similar to Splitwise, this application helps groups split expenses fairly and calculates optimized settlements.

## 🚀 Features

### Core Functionality
- **Expense Management**: Add, view, edit, and delete expenses
- **Automatic Person Tracking**: People are automatically tracked when mentioned in expenses
- **Settlement Calculations**: Smart algorithms to minimize the number of transactions needed
- **Multiple Split Types**: Equal split, percentage split, and exact amount split
- **Data Validation**: Comprehensive input validation and error handling
- **Real-time Updates**: Live dashboard with expense statistics

### Settlement Logic
The application uses a greedy algorithm to minimize the number of transactions needed to settle all balances:
1. Calculate each person's net balance (total paid - total owed)
2. Separate creditors (positive balance) and debtors (negative balance)
3. Match the largest creditor with the largest debtor
4. Settle the minimum of their absolute balances
5. Repeat until all balances are settled

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Validation**: Zod schemas
- **Deployment**: Replit

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or use the provided DATABASE_URL)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd splitwise-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   The application uses the following environment variables (already configured in Replit):
   - `DATABASE_URL` - PostgreSQL connection string
   - `NODE_ENV` - Environment (development/production)

4. **Push database schema**
   ```bash
   npm run db:push
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

The application will be available at `http://localhost:5000`

### Deployment on Replit

1. **Fork this Repl or import the code**
2. **The database is already configured** - DATABASE_URL is provided as a secret
3. **Click Run** - The application will automatically:
   - Install dependencies
   - Push the database schema
   - Start the server on port 5000

## 📚 API Documentation

### Base URL
- Local: `http://localhost:5000/api`
- Replit: `https://your-replit-name.replit.app/api`

### Endpoints

#### Expense Management

**GET /api/expenses**
- List all expenses
- Response: Array of expense objects

**POST /api/expenses**
- Add new expense
- Body:
  ```json
  {
    "amount": "60.00",
    "description": "Dinner at restaurant",
    "paid_by": "Shantanu",
    "split_type": "equal"
  }
  ```

**PUT /api/expenses/:id**
- Update expense
- Body: Partial expense object

**DELETE /api/expenses/:id**
- Delete expense
- Returns success confirmation

#### Analytics & Settlements

**GET /api/people**
- List all people derived from expenses
- Returns: Array of person objects with balances

**GET /api/balances**
- Show each person's balance (same as /people)
- Returns: Array with total_paid, total_owed, and balance for each person

**GET /api/settlements**
- Get optimized settlement recommendations
- Returns: Array of { from, to, amount } objects

**GET /api/stats**
- Get dashboard statistics
- Returns: { totalExpenses, totalAmount, pendingSettlements }

### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
