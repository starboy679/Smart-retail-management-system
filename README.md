A&A Auto Parts

A web-based auto parts management system designed to simplify store operations, including sales, inventory, purchasing, customer management, and reporting.

Live Website: https://aa-auto-parts.vercel.app

GitHub Repository: https://github.com/starboy679/Smart-retail-management-system

Features

* Dashboard with sales, revenue, and inventory statistics.
* Point of Sale (POS) and invoice generation.
* Product and category management.
* Inventory tracking and low-stock alerts.
* Purchase and sales management.
* Customer management.
* Multi-currency and exchange rate management.
* Sales and inventory reports.
* JWT authentication and protected API routes.

Technology Stack

Frontend: React 19, TypeScript, Vite, Tailwind CSS, React Router.

Backend: Node.js, Express.js, TypeScript, REST API, JWT.

Database: MySQL, MySQL2.

UI Libraries: Framer Motion, Lucide React.

Project Structure

* src/ – Frontend application.
* src/api/ – API integration.
* src/components/ – Reusable components.
* src/pages/ – Application pages.
* server/src/routes/ – Backend API routes.
* server/src/middleware/ – Authentication and authorization.
* server/src/db.ts – Database connection.

Local Installation

1. Clone the repository

git clone https://github.com/starboy679/Smart-retail-management-system.git
cd Smart-retail-management-system

2. Install frontend dependencies

npm install

3. Install backend dependencies

cd server
npm install

4. Configure environment variables

Create a .env file inside the server directory:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=your_database_name
JWT_SECRET=your_secure_secret
PORT=5000

5. Set up the database

* Start MySQL.
* Create the database.
* Import server/src/schema.sql.
* Apply any additional required migrations.

6. Start the backend

npm run dev

7. Start the frontend

From the project root, open another terminal:

npm run dev

Production Deployment

Service	Platform
Frontend	Vercel
Backend API	Railway
Database	Railway MySQL

Configure VITE_API_URL with the production backend API URL.

Security

* Never commit .env files.
* Keep database credentials private.
* Use a strong JWT secret.
* Restrict CORS to trusted frontend domains.

Project Goal

A&A Auto Parts aims to provide an integrated solution for managing auto parts store operations, improving inventory visibility, simplifying sales, and supporting business decisions.

⸻

Developed by: Abdalbagi Essameldein