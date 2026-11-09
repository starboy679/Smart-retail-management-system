🦅 Smart Retail Management System – Project Falcon

A modern web-based retail management system designed to simplify sales operations, inventory tracking, purchasing, and business management.

Project Falcon provides an integrated solution for managing retail stores through a responsive dashboard, Point of Sale (POS), product management, inventory control, and financial reporting.

🚀 Features

📊 Dashboard

* Overview of sales and revenue.
* Total products and inventory statistics.
* Low-stock monitoring.
* Business performance insights.

🛒 Point of Sale (POS)

* Fast sales processing.
* Shopping cart management.
* Automatic invoice generation.
* Sales transaction tracking.

📦 Product Management

* Add, edit, and manage products.
* Organize products into categories.
* Manage product prices and details.

📋 Inventory Management

* Real-time stock tracking.
* Monitor stock movements.
* Low-stock alerts.

💰 Purchases & Sales

* Record purchase transactions.
* Manage customer sales.
* Track transaction history.

🌍 Multi-Currency Support

* Support for multiple currencies.
* Currency management.
* Exchange rate management.
* Multi-currency sales and purchasing.

👥 Customer Management

* Maintain customer records.
* View customer information.
* Track customer transactions.

📈 Reports

* Sales reports.
* Inventory reports.
* Business performance summaries.

🔐 Authentication

* Secure login system.
* JWT-based authentication.
* Protected API routes.

🛠️ Technology Stack

Frontend

* React 19
* TypeScript
* Vite
* Tailwind CSS
* React Router
* Axios
* Framer Motion
* Lucide React

Backend

* Node.js
* Express.js
* TypeScript
* REST API
* JWT Authentication

Database

* MySQL
* MySQL2

📁 Project Structure

project-falcon/
│
├── public/
│
├── server/
│   ├── src/
│   │   ├── middleware/
│   │   ├── migrations/
│   │   ├── routes/
│   │   ├── db.ts
│   │   ├── schema.sql
│   │   ├── seed.ts
│   │   └── server.ts
│   │
│   ├── .env.example
│   └── package.json
│
├── src/
│   ├── api/
│   ├── components/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
│
├── index.html
├── package.json
└── README.md

⚙️ Installation & Setup

1. Clone the Repository

git clone https://github.com/starboy679/Smart-retail-management-system.git
cd Smart-retail-management-system

2. Install Frontend Dependencies

npm install

3. Install Backend Dependencies

cd server
npm install

4. Configure Environment Variables

Create a .env file inside the server directory.

Use the following configuration:

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=project_falcon
JWT_SECRET=your_secure_secret_key
PORT=5000

Update the database credentials according to your MySQL configuration.

5. Database Setup

* Start your MySQL server.
* Create a database named project_falcon.
* Import the database schema from server/src/schema.sql.
* Apply any additional migrations if required.

6. Run the Backend

From the server directory:

npm run dev

The backend API will run on:

http://localhost:5000

7. Run the Frontend

Open another terminal in the project root:

npm run dev

Open the local development URL provided by Vite.

🏗️ Production Build

Build the frontend:

npm run build

Build the backend:

npm run server:build

Start the production backend:

cd server
npm start

🔒 Security Notes

* Never upload .env files to GitHub.
* Keep database credentials private.
* Use a strong JWT secret.
* Configure CORS for trusted frontend domains in production.

🎯 Project Objective

Project Falcon aims to provide small and medium-sized retail businesses with a centralized platform for managing daily operations, improving inventory visibility, simplifying sales processing, and supporting better business decisions.

⸻

Project Name: Smart Retail Management System – Project Falcon

Repository: GitHub

Developed by: Abdalbagi Essameldein