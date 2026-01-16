import fs from 'fs';
import path from 'path';
import Employee from '../models/Employee.js';
import Lead from '../models/Lead.js';
import Project from '../models/Project.js';
import Task from '../models/Task.js';
import Attendance from '../models/Attendance.js';
import Invoice from '../models/Invoice.js';

const exportToCSV = (data, filename) => {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(val => 
      typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
};

const backupData = async (req, res) => {
  try {
    const { format = 'json', tables = 'all' } = req.query;
    
    const data = {};
    const tableList = tables === 'all' ? 
      ['employees', 'leads', 'projects', 'tasks', 'attendance', 'invoices'] : 
      tables.split(',');

    for (const table of tableList) {
      switch (table) {
        case 'employees':
          data.employees = await Employee.find().lean();
          break;
        case 'leads':
          data.leads = await Lead.find().lean();
          break;
        case 'projects':
          data.projects = await Project.find().lean();
          break;
        case 'tasks':
          data.tasks = await Task.find().lean();
          break;
        case 'attendance':
          data.attendance = await Attendance.find().lean();
          break;
        case 'invoices':
          data.invoices = await Invoice.find().lean();
          break;
      }
    }

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'csv') {
      const backupDir = path.join(__dirname, '../backups/csv');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      
      const files = [];
      for (const [tableName, tableData] of Object.entries(data)) {
        if (tableData.length) {
          const csv = exportToCSV(tableData, tableName);
          const filename = `${tableName}_${timestamp}.csv`;
          const filepath = path.join(backupDir, filename);
          fs.writeFileSync(filepath, csv);
          files.push(filename);
        }
      }
      
      res.json({ success: true, format: 'csv', files, path: backupDir });
    } else {
      const backupDir = path.join(__dirname, '../backups/json');
      if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });
      
      const filename = `backup_${timestamp}.json`;
      const filepath = path.join(backupDir, filename);
      fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
      
      res.json({ success: true, format: 'json', file: filename, path: backupDir });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export { backupData };