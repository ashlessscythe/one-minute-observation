# 👁️ One Minute Observation App

This application allows supervisors to record and manage one-minute observations of their team members.

## 🚀 Prerequisites

- Node.js (v14 or later)
- npm or yarn
- PostgreSQL database
- Docker (optional)

## 🛠️ Environment Setup

Create a `.env` file in the root directory with the following variables:

```
REACT_APP_API_URL=http://localhost:3001
PORT=3000
NODE_ENV=development
DATABASE_URL=your-postgres-database-url
REACT_APP_AUTHORIZER_URL=your-authorizer-url
REACT_APP_AUTHORIZER_CLIENT_ID=your-authorizer-client-id
```

Replace the placeholder values with your actual configuration.

## 📦 Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ashlessscythe/one-minute-observation-app.git
   cd one-minute-observation-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

## 💾 Database Setup

1. Apply migrations:
   ```bash
   npx prisma migrate dev
   ```
   or
   ```bash
   npx prisma migrate deploy
   ```

2. Seed the database:
   - Create a `users.csv` file in the root directory with the following format:
     ```
     name,isSupervisor,site
     John Doe,true,SITENAME
     Jane Smith,false,SITENAME
     ```
   - Run the seed script:
     ```bash
     node seed.js
     ```
     or
     ```bash
     npx prisma db seed
     ```
   - To clear the database before seeding, use the `--clear` flag:
     ```bash
     node seed.js --clear
     ```

## 🚀 Running the Application

### Development Mode

Run the following command:

```bash
npm run dev
```

The application will be available at http://localhost:3000.

### Production Build

1. Build the frontend:
   ```bash
   npm run build
   ```

2. Serve the built files:
   ```bash
   npm start
   ```

## 🐳 Docker Deployment (Optional)

1. Build the Docker image:
   ```bash
   docker build -t one-minute-observation-app .
   ```

2. Run the container:
   ```bash
   docker run -p 3000:3000 --env-file .env one-minute-observation-app
   ```

## 🔐 Authentication

This app uses Authorizer for authentication. Make sure to set up your Authorizer instance and provide the correct `REACT_APP_AUTHORIZER_URL` and `REACT_APP_AUTHORIZER_CLIENT_ID` in the `.env` file.

## 🌐 API Endpoints

- `GET /api/observations`: Fetch all observations
- `POST /api/observations`: Create a new observation
  - Note: For observations with topic "Unsafe Condition", the associate name is optional and will default to "N/A" if not provided
- `GET /api/users`: Fetch all users

## 📝 Observation Form Behavior

When creating a new observation:
- Associate name is required for all observation topics except "Unsafe Condition"
- For "Unsafe Condition" observations:
  - Associate name field becomes optional
  - If no associate name is provided, it automatically defaults to "N/A"
  - This helps track unsafe conditions that aren't associated with a specific individual

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.
