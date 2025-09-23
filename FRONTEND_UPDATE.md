# Frontend Update Required

## Change API Endpoint

In your React component `EmployeeTimesheet.js`, update the API endpoint:

**Change this line:**
```javascript
const response = await fetch(`${API_URL}/api/timesheet`, {
```

**To:**
```javascript
const response = await fetch(`${API_URL}/api/employee-timesheet`, {
```

**Also change this line:**
```javascript
const response = await fetch(`${API_URL}/api/timesheet`);
```

**To:**
```javascript
const response = await fetch(`${API_URL}/api/employee-timesheet`);
```

## API Endpoints

- **Submit Timesheet**: `POST /api/employee-timesheet`
- **Get Timesheets**: `GET /api/employee-timesheet`
- **Available Tasks**: `GET /api/tasks/available` (unchanged)
- **Employee Tasks**: `GET /api/tasks/employee/:id` (unchanged)
- **Take Task**: `PATCH /api/tasks/:id/take` (unchanged)
- **Update Progress**: `PATCH /api/tasks/:id/progress` (unchanged)

That's it! Only 2 lines need to be changed in your frontend code.