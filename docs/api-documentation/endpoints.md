# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints (except `/api/auth/login` and `/api/health`) require a JWT token in the header:

```
Authorization: Bearer <token>
```

### Login

**POST** `/auth/login`

Request:
```json
{
  "username": "admin",
  "password": "your_password",
  "role": "hr"
}
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "userName": "System Administrator",
  "userId": "681ccaf9c0a8016401c5a33be04be441",
  "role": "hr"
}
```

### Logout

**POST** `/auth/logout`

Response:
```json
{
  "success": true,
  "message": "Logged out successfully."
}
```

### Session Check

**GET** `/auth/session`

Response:
```json
{
  "success": true,
  "user": {
    "userId": "681ccaf9c0a8016401c5a33be04be441",
    "userName": "System Administrator",
    "role": "hr",
    "iat": 1715366400,
    "exp": 1715395200
  }
}
```

---

## Employees

### List Employees

**GET** `/employees`

Response:
```json
[
  {
    "id": "abc123",
    "name": "John Doe",
    "email": "john@enterprise.com",
    "department": "IT",
    "joiningDate": "2026-05-15",
    "status": "Pending"
  }
]
```

### Create Employee

**POST** `/employees`

Requires: `HR` role

Request:
```json
{
  "name": "Jane Smith",
  "email": "jane@enterprise.com",
  "department": "HR",
  "joiningDate": "2026-06-01"
}
```

---

## Tasks

### List Tasks

**GET** `/tasks`

### Update Task

**PUT** `/tasks/:id`

Requires: `HR` or `Manager` role

Request:
```json
{
  "status": "Completed"
}
```

---

## Issues

### List Issues

**GET** `/issues`

### Create Issue

**POST** `/issues`

Request:
```json
{
  "description": "Login page not loading",
  "priority": "High"
}
```

---

## Projects

### List Projects

**GET** `/projects`

### Create Project

**POST** `/projects`

Requires: `HR` or `Manager` role

Request:
```json
{
  "project_name": "Website Redesign",
  "client_name": "Acme Corp",
  "project_manager": "John Smith",
  "deadline": "2026-12-31"
}
```

---

## Sprint Tasks

### List Sprint Tasks

**GET** `/sprint-tasks`

### Update Progress

**PUT** `/sprint-tasks/:id`

Requires: `HR` or `Manager` role

Request:
```json
{
  "progress": 75
}
```

---

## Daily Menu

### List Menu Items

**GET** `/menu`

### Create Menu Item

**POST** `/menu`

Requires: `HR` role

Request:
```json
{
  "itemName": "Grilled Salmon",
  "category": "Lunch",
  "calories": 520,
  "available": true
}
```

### Update Menu Item

**PUT** `/menu/:id`

Requires: `HR` role

### Delete Menu Item

**DELETE** `/menu/:id`

Requires: `HR` role

### Menu Analytics

**GET** `/menu/analytics`

Response:
```json
{
  "totalItems": 4,
  "availableItems": 3,
  "unavailableItems": 1,
  "byCategory": {
    "Lunch": 2,
    "Snack": 1,
    "Beverage": 1
  }
}
```

---

## Stats

### Dashboard Stats

**GET** `/stats`

Response:
```json
{
  "totalEmployees": 10,
  "onboardedEmployees": 7,
  "pendingTasks": 3,
  "activeIssues": 0
}
```

### Employee Performance Stats

**GET** `/stats/employee`

Response:
```json
{
  "priority": { "High": 1, "Medium": 1, "Low": 1 },
  "sla": { "Met": 1, "Breached": 1, "InProgress": 1 },
  "avgProgress": 55,
  "totalTasks": 3
}
```

---

## AI Chatbot

### Send Message

**POST** `/chat`

Request:
```json
{
  "message": "What is the SLA status?"
}
```

Response:
```json
{
  "reply": "The SLA Engine monitors all sprint tasks..."
}
```

---

## Health Check

**GET** `/health`

No authentication required.

Response:
```json
{
  "status": "OK",
  "timestamp": "2026-05-10T21:40:55.000Z",
  "environment": "development"
}
```

---

## Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Description of the error"
}
```

Common status codes:

| Code | Meaning |
|------|---------|
| 400 | Bad Request — Validation failed |
| 401 | Unauthorized — Missing or invalid token |
| 403 | Forbidden — Insufficient role privileges |
| 404 | Not Found — Route does not exist |
| 429 | Too Many Requests — Rate limit exceeded |
| 500 | Internal Server Error |
