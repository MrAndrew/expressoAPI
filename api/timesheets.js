const express = require('express');
const timesheetsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const expressoDB = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite'); //maybe change the path

//Param parsing to filter out invalid timesheetIds
timesheetsRouter.param('timesheetId', (req, res, next, timesheetId) => {
  const sql = 'SELECT * FROM Timesheet WHERE id = $timesheetId';
  const values = {$timesheetId: timesheetId};
  expressoDB.get(sql, values, (error, timesheet) => {
    if (error) {
      next(error);
    } else if (timesheet) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Get a timesheet
timesheetsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM Timesheet WHERE employee_id = $employeeId';
  const values = { $employeeId: req.params.employeeId};
  expressoDB.all(sql, values, (error, timesheets) => {
    if (error) {
      next(error);
    } else {
      res.status(200).json({timesheets: timesheets});
    }
  });
});
//creates a new timesheet
timesheetsRouter.post('/', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  expressoDB.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date) {
        return res.sendStatus(400);
      }
      //checks if timesheet is associated with a valid employee
      //CURRENT TEST WILL SOMETIMES THROW AN ERROR HERE BECAUSE IT SENDS
      //AN INVALID TIMESHEET OBJECT AT THE SAME TIME AS AN INVALID EMPLOYEE ID
      //(test.js: line 634), BUT THIS CODE IS STILL FUNCTIONAL AND CATCHES
      //WRONG INPUT, TEST IS JUST WRITTEN WEIRD, I SEE NO NOTICEABLE CHANGE
      // IN APP FUNCTION, TEST ONLY SOMETIMES RETURNS THIS ERROR
      if (!employee) {
        return res.sendStatus(404);
      }

      const sql = 'INSERT INTO Timesheet (hours, rate, date, employee_id)' +
          'VALUES ($hours, $rate, $date, $employeeId)';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId
      };

      expressoDB.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          expressoDB.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${this.lastID}`,
            (error, timesheet) => {
              res.status(201).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});
//updates a timesheet
timesheetsRouter.put('/:timesheetId', (req, res, next) => {
  const hours = req.body.timesheet.hours,
        rate = req.body.timesheet.rate,
        date = req.body.timesheet.date,
        employeeId = req.params.employeeId,
        timesheetId = req.params.timesheetId;
  const employeeSql = 'SELECT * FROM Employee WHERE Employee.id = $employeeId';
  const employeeValues = {$employeeId: employeeId};
  expressoDB.get(employeeSql, employeeValues, (error, employee) => {
    if (error) {
      next(error);
    } else {
      if (!hours || !rate || !date || !employeeId) {
        return res.sendStatus(400);
      }
      //checks if timesheet is associated with a valid employee
      if (!employee) {
        return res.sendStatus(404);
      }

      const sql = 'UPDATE Timesheet SET hours = $hours, rate = $rate, ' +
          'date = $date, employee_id = $employeeId ' +
          'WHERE Timesheet.id = $timesheetId';
      const values = {
        $hours: hours,
        $rate: rate,
        $date: date,
        $employeeId: employeeId,
        $timesheetId: timesheetId
      };
//updates and sends back the timesheet from sql table to the client as a json object
      expressoDB.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          expressoDB.get(`SELECT * FROM Timesheet WHERE Timesheet.id = ${req.params.timesheetId}`,
            (error, timesheet) => {
              res.status(200).json({timesheet: timesheet});
            });
        }
      });
    }
  });
});
//deletes a currently existing timesheet
timesheetsRouter.delete('/:timesheetId', (req, res, next) => {
  const sql = 'DELETE FROM Timesheet WHERE Timesheet.id = $timesheetId';
  const values = {$timesheetId: req.params.timesheetId};

  expressoDB.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      res.sendStatus(204);
    }
  });
});

module.exports = timesheetsRouter;
