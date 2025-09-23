// Simple test file to verify timesheet API endpoints
// Run this after starting the server to test the API

const API_URL = 'http://localhost:5000'; // Adjust port if different

// Test data
const testTimesheet = {
  employee_id: "507f1f77bcf86cd799439011", // Replace with actual employee ID
  employee_name: "Test Employee",
  date: "2024-01-15",
  time_entries: [
    {
      start_time: "10:30",
      end_time: "11:30",
      task_description: "Working on frontend development",
      project_name: "CRM Project",
      hours_worked: 1,
      task_id: null
    },
    {
      start_time: "11:30",
      end_time: "12:30",
      task_description: "Code review and testing",
      project_name: "CRM Project",
      hours_worked: 1,
      task_id: null
    }
  ],
  total_hours: 2,
  status: "Submitted"
};

async function testTimesheetAPI() {
  try {
    console.log('Testing Timesheet API...\n');

    // Test 1: Submit timesheet
    console.log('1. Testing POST /api/timesheet (Submit timesheet)');
    const submitResponse = await fetch(`${API_URL}/api/timesheet`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testTimesheet)
    });
    
    if (submitResponse.ok) {
      const submitData = await submitResponse.json();
      console.log('✅ Timesheet submitted successfully');
      console.log('Response:', submitData);
    } else {
      console.log('❌ Failed to submit timesheet');
      console.log('Status:', submitResponse.status);
      console.log('Response:', await submitResponse.text());
    }

    // Test 2: Get timesheets
    console.log('\n2. Testing GET /api/timesheet (Get timesheets)');
    const getResponse = await fetch(`${API_URL}/api/timesheet`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ Timesheets retrieved successfully');
      console.log('Found', getData.timesheets?.length || 0, 'timesheets');
    } else {
      console.log('❌ Failed to get timesheets');
      console.log('Status:', getResponse.status);
    }

    // Test 3: Get available tasks
    console.log('\n3. Testing GET /api/tasks/available (Get available tasks)');
    const tasksResponse = await fetch(`${API_URL}/api/tasks/available`);
    
    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json();
      console.log('✅ Available tasks retrieved successfully');
      console.log('Found', tasksData.data?.length || 0, 'available tasks');
    } else {
      console.log('❌ Failed to get available tasks');
      console.log('Status:', tasksResponse.status);
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('\n💡 Make sure the server is running on', API_URL);
  }
}

// Run the test
testTimesheetAPI();