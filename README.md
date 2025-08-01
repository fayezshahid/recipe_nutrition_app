# 🥗 Nutrition App – Angular + Laravel

This is a full-stack web application designed to manage recipes and provide nutrition information for ingredients. The application is built with **Angular** for the frontend and **Laravel** for the backend API.

---

## 📁 Folder Structure

```
project-root/
├── frontend/         # Angular frontend
└── backend/          # Laravel backend (API)
```

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following software installed on your system:

### Frontend (Angular)

- **Node.js**: Version 16 or higher  
- **Angular CLI**: Install globally using:

```bash
npm install -g @angular/cli
```

### Backend (Laravel)

- **PHP**: Version 8.0 or higher  
- **Composer**: For PHP dependency management  
- **MySQL** (or other supported database)

---

## 🚀 Setting up the Angular App (Frontend)

1. Navigate to the Angular project directory:

```bash
cd frontend
```

2. Install frontend dependencies:

```bash
npm install
```

3. Serve the Angular application locally:

```bash
ng serve
```

The Angular app will be available at: [http://localhost:4200](http://localhost:4200)

---

## 🧪 Setting up the Laravel API (Backend)

1. Navigate to the Laravel backend folder:

```bash
cd backend
```

2. Install backend dependencies using Composer:

```bash
composer install
```

3. Copy the environment file:

```bash
cp .env.example .env
```

4. Configure your `.env` file with your DB credentials:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=your_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

5. Generate the application key:

```bash
php artisan key:generate
```

6. Run database migrations:

```bash
php artisan migrate
```

7. Start the Laravel development server:

```bash
php artisan serve
```

The Laravel API will be available at: [http://localhost:8000](http://localhost:8000)

---

## 🔗 API Endpoints

### 📘 Recipes API

| Method | Endpoint              | Description                |
|--------|-----------------------|----------------------------|
| GET    | `/api/recipes`        | Get all recipes            |
| POST   | `/api/recipes`        | Create a new recipe        |
| GET    | `/api/recipes/{id}`   | Get a specific recipe      |
| PUT    | `/api/recipes/{id}`   | Update a specific recipe   |
| DELETE | `/api/recipes/{id}`   | Delete a specific recipe   |

### 🥕 Ingredients API

| Method | Endpoint                             | Description                     |
|--------|--------------------------------------|---------------------------------|
| GET    | `/api/ingredients`                   | Get all ingredients             |
| GET    | `/api/ingredients/search/{name}`     | Search ingredient by name       |
| POST   | `/api/ingredients`                   | Add a new ingredient            |


---

## ✅ Notes

- Make sure both frontend and backend servers are running simultaneously.

---

## 📞 Support

For questions or help, feel free to contact the developer team or open an issue.
