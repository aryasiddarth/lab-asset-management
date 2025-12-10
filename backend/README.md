# Lab Asset Management Backend

Backend server for the Lab Asset Management system using Node.js, Express, and MongoDB.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
   - Copy `.env` and update `MONGODB_URI` and `JWT_SECRET`

3. Make sure MongoDB is running:
   - Local: `mongodb://localhost:27017/lab-asset-management`
   - Or update `.env` with your MongoDB connection string

## Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## Seeding Test Users

Create test user accounts:
```bash
npm run seed:users
```

This creates the following test accounts:
- **Admin**: `admin@lab.com` / `admin123`
- **Manager**: `manager@lab.com` / `manager123`
- **Technician**: `tech@lab.com` / `tech123`
- **Viewer**: `viewer@lab.com` / `viewer123`

## Importing Data

### Import from Excel:
```bash
npm run import:excel path/to/your/data.xlsx
```

Excel file should have sheets named "Labs" and "Assets" with appropriate columns.

### Import from DOC:
```bash
npm run import:doc path/to/your/data.doc
```

Note: DOC parsing may need adjustment based on your document format.

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email and password

### Labs
- `GET /api/labs` - Get all labs
- `GET /api/labs/:id` - Get lab by ID
- `POST /api/labs` - Create lab (protected)

### Assets
- `GET /api/assets` - Get all assets (supports `?labId=` and `?status=` filters)
- `GET /api/assets/:id` - Get asset by ID
- `POST /api/assets` - Create asset (protected)

### Import/Export
- `POST /api/import/excel` - Import Excel file (protected)
- `GET /api/import/excel` - Export to Excel (protected)

## Environment Variables

- `PORT` - Server port (default: 5000)
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `NODE_ENV` - Environment (development/production)

