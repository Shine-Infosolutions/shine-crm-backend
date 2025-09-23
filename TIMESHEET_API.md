# Employee Timesheet API Documentation

## Overview
This API provides endpoints for managing employee timesheets with time entries, task management, and submission functionality.

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### 1. Submit/Update Timesheet
**POST** `/timesheet`

Submit or update an employee's timesheet for a specific date.

**Request Body:**
```json
{
  "employee_id": "507f1f77bcf86cd799439011",
  "employee_name": "John Doe",
  "date": "2024-01-15",
  "time_entries": [
    {
      "start_time": "10:30",
      "end_time": "11:30",
      "task_description": "Working on frontend development",
      "project_name": "CRM Project",
      "hours_worked": 1,
      "task_id": null
    }
  ],
  "total_hours": 7,
  "status": "Submitted"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "employee_id": "507f1f77bcf86cd799439011",
    "employee_name": "John Doe",
    "date": "2024-01-15T00:00:00.000Z",
    "time_entries": [...],
    "total_hours": 7,
    "status": "Submitted",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Timesheet saved successfully"
}
```

### 2. Get Timesheets
**GET** `/timesheet`

Retrieve timesheets with optional filtering.

**Query Parameters:**
- `employee_id` (optional): Filter by employee ID
- `date_from` (optional): Start date filter
- `date_to` (optional): End date filter

**Response:**
```json
{
  "success": true,
  "timesheets": [
    {
      "_id": "...",
      "employee_id": {...},
      "employee_name": "John Doe",
      "date": "2024-01-15T00:00:00.000Z",
      "time_entries": [...],
      "total_hours": 7,
      "status": "Submitted",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

### 3. Get Available Tasks
**GET** `/tasks/available`

Get all tasks available for employees to take.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Frontend Development",
      "description": "Develop user interface components",
      "priority": "High",
      "status": "Available",
      "due_date": "2024-01-20T00:00:00.000Z",
      "assigned_by": {...}
    }
  ]
}
```

### 4. Get Employee Tasks
**GET** `/tasks/employee/:employee_id`

Get all tasks assigned to or taken by a specific employee.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "title": "Backend API Development",
      "description": "Create REST API endpoints",
      "priority": "Medium",
      "status": "In Progress",
      "progress": 50,
      "assigned_to": "507f1f77bcf86cd799439011",
      "taken_by": "507f1f77bcf86cd799439011"
    }
  ]
}
```

### 5. Take Task
**PATCH** `/tasks/:id/take`

Employee takes an available task.

**Request Body:**
```json
{
  "employee_id": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "title": "Frontend Development",
    "status": "In Progress",
    "taken_by": "507f1f77bcf86cd799439011"
  },
  "message": "Task taken successfully"
}
```

### 6. Update Task Progress
**PATCH** `/tasks/:id/progress`

Update progress on a task.

**Request Body:**
```json
{
  "progress": 75,
  "notes": "Completed user authentication module",
  "time_spent": 120
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "progress": 75,
    "work_logs": [...]
  },
  "message": "Progress saved successfully"
}
```

## Time Slots
The frontend uses predefined time slots from 10:30 AM to 6:30 PM, excluding lunch time (1:30 PM - 2:30 PM):

- 10:30 AM - 11:30 AM
- 11:30 AM - 12:30 PM  
- 12:30 PM - 1:30 PM
- 2:30 PM - 3:30 PM (Lunch break: 1:30 PM - 2:30 PM)
- 3:30 PM - 4:30 PM
- 4:30 PM - 5:30 PM
- 5:30 PM - 6:30 PM

## Status Values
- **Draft**: Timesheet is being worked on
- **Submitted**: Timesheet has been submitted for approval
- **Approved**: Timesheet has been approved by manager

## Error Handling
All endpoints return appropriate HTTP status codes:
- 200: Success
- 201: Created
- 400: Bad Request
- 404: Not Found
- 500: Internal Server Error

Error responses follow this format:
```json
{
  "success": false,
  "message": "Error description"
}
```