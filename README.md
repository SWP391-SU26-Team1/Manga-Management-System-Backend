# Manga Management System Backend

Node.js Express API backend for the Manga Management System.

## Features

- User authentication with JWT
- Role-based access control
- Manga series management
- Chapter and page management
- Review sessions and voting system
- File upload support
- Data validation with Zod
- Security with Helmet

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT + Bcrypt
- **Validation**: Zod
- **File Upload**: Multer
- **Security**: Helmet, CORS
- **Logging**: Morgan
- **Dev Tools**: Nodemon

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Supabase account and credentials

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd Manga-Management-System-Backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the root directory:

```
PORT=5000

SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

JWT_SECRET=your_jwt_secret_key
```

4. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## Scripts

- `npm run dev` - Start the development server with auto-reload (Nodemon)
- `npm start` - Start the production server

## Project Structure

```
src/
├── app.js                 # Express app configuration
├── server.js              # Server entry point
├── config/
│   └── supabase.js       # Supabase client configuration
├── modules/              # Feature modules
│   ├── auth/             # Authentication module
│   ├── users/            # User management
│   ├── series/           # Manga series
│   ├── chapters/         # Chapters
│   ├── pages/            # Pages
│   ├── pageTasks/        # Page tasks
│   ├── annotations/      # Annotations
│   ├── reviewSessions/   # Review sessions
│   ├── votes/            # Voting system
│   ├── rankings/         # Rankings
│   ├── manuscripts/      # Manuscripts
│   └── notifications/    # Notifications
├── middlewares/          # Custom middlewares
│   ├── auth.middleware.js
│   └── error.middleware.js
└── utils/               # Utility functions
    └── response.js      # API response helpers
```

## API Response Format

All API responses follow a standardized format:

```json
{
  "statusCode": 200,
  "data": {},
  "message": "Success",
  "success": true
}
```

## Environment Variables

| Variable                    | Description                              |
| --------------------------- | ---------------------------------------- |
| `PORT`                      | Server port (default: 5000)              |
| `SUPABASE_URL`              | Supabase project URL                     |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (backend only) |
| `JWT_SECRET`                | JWT secret key for token signing         |

## License

ISC
