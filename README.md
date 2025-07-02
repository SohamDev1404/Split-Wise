- Base URL: https://split-wise-hhst.onrender.com
- Postman API Testing : https://www.postman.com/telecoms-cosmonaut-64114015/workspace/personal-workspace/collection/37412145-596e1436-2fcf-4b4e-92b1-a0a7a12a871b?action=share&creator=37412145
- NeonDB Connection string : postgresql://neondb_owner:npg_q9Qy6geAdvNO@ep-withered-fire-a8hlvk1g-pooler.eastus2.azure.neon.tech/neondb?sslmode=require&channel_binding=require
- Gist Github URL : https://gist.github.com/SohamDev1404/ac9eae5c9f2d855002921506106d8d4f


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

## 🛠️ Tech Stack

- **Backend**: Node.js with Express.js
- **Database**: PostgreSQL with Drizzle ORM
- **Frontend**: React with TypeScript, Tailwind CSS, shadcn/ui
- **State Management**: TanStack Query (React Query)
- **Validation**: Zod schemas

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database (or use the provided DATABASE_URL)

### Local Development

## Local Setup

1. **Clone the repository**
   ```sh
   git clone <your-repo-url>
   cd Split-Wise
   ```

2. **Install dependencies**
   ```sh
   npm install
   cd client
   npm install
   cd ..
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and set your NeonDB connection string:
     ```
     DATABASE_URL=postgres://<user>:<password>@<host>/<db>
     ```

4. **Run database migrations**
   ```sh
   npm run db:push
   ```

5. **Seed the database**
   ```sh
   npm run seed
   ```

6. **Start the backend**
   ```sh
   npm run dev
   ```

7. **Start the frontend**
   ```sh
   cd client
   npm run dev
   ```

---

The application will be available at `http://localhost:5000`


## 📚 API Documentation

### Base URL
- Local: `http://localhost:5000/api`

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
  "amount": "4000",
  "description": "Shopping",
  "paid_by": "Soham",
  "split_with": ["Anup", "Anagha"],
  "split_type": "equal",
  "is_recurring": false
}


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

**GET /api/settlements/settled**
-— List all settled transactions

**GET /api/stats**
- Get dashboard statistics
- Returns: { totalExpenses, totalAmount, pendingSettlements }

  ## Database Schema

See [`shared/schema.ts`](shared/schema.ts) and [`migrations/`](migrations/) for schema and migration scripts.

---

## Deployment

- Backend: [https://split-wise-hhst.onrender.com](https://split-wise-hhst.onrender.com)
- Database: NeonDB (cloud-hosted)

---

## Known Limitations

- Only supports group-based settlements (not per-expense custom splits)
- No authentication (public API)
- Floating point rounding may cause minor discrepancies

---

**🧮 Settlement Calculation Logic**
- How does the app figure out who pays whom?
- 1.List all people in the group.
- 2.Calculate each person’s balance:
-- Balance = Total paid minus total owed.
- 3.Split into two groups:
-- Creditors: People who are owed money (positive balance).
-- Debtors: People who owe money (negative balance).
- 4.While there are both creditors and debtors:
-- Pick the person who owes the most (debtor).
-- Pick the person who is owed the most (creditor).
-- The debtor pays the creditor the smaller of what they owe or what the creditor is owed.
-- Update both balances.
-- If anyone’s balance becomes zero, remove them from the list.
- 5.Repeat until everyone’s balance is zero.

[Start]
|
[List all people]
|
[Calculate balances]
|
[Split into Creditors & Debtors]
|
[While both exist]
|
[Pick top Debtor & Creditor]
|
[Debtor pays Creditor]
|
[Update balances]
|
[Remove anyone with zero balance]
|
[Repeat]
|
[All balances zero?]
|
Yes
|
[End: All debts settled!]

    Start --> ListAllPeople --> CalculateBalances --> SplitGroups --> LoopCheck
    LoopCheck -->|Yes| PickTop --> Pay --> UpdateBalances --> RemoveZero --> RepeatCheck --> LoopCheck
    LoopCheck -->|No| AllZero --> End


### Response Format
All API responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}

