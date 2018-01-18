const express = require('express');
const employeesRouter = express.Router();

const sqlite3 = require('sqlite3');
const expressoDB = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite'); //maybe change the path

const timesheetsRouter = require('./timesheets.js');

//Put a param here
employeesRouter.param('employeeId', (req, res, next, employeeId) => {
  const sql = 'SELECT * FROM Employee WHERE id = $employeeId';
  const values = {$employeeId: employeeId};
  expressoDB.get(sql, values, (error, employee) => {
    if (error) {
      next(error);
    } else if (employee) {
      req.employee = employee;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

employeesRouter.use('/:employeeId/timesheets', timesheetsRouter);

//request routes here
//get all current employees
employeesRouter.get('/', (req, res, next) => {
  expressoDB.all('SELECT * FROM Employee WHERE is_current_employee = 1',
    (err, employees) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({employees: employees});
      }
    });
});
//get employee by id
employeesRouter.get('/:employeeId', (req, res, next) => {
  res.status(200).json({employee: req.employee});
});
//post employee
employeesRouter.post('/', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentlyEmployed = req.body.employee.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Employee (name, position, wage, is_current_employee)' +
      'VALUES ($name, $position, $wage, $isCurrentlyEmployed)';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentlyEmployed: isCurrentlyEmployed
  };

  expressoDB.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      expressoDB.get(`SELECT * FROM Employee WHERE Employee.id = ${this.lastID}`,
        (error, employee) => {
          res.status(201).json({employee: employee});
        });
    }
  });
});
//update an employee
employeesRouter.put('/:employeeId', (req, res, next) => {
  const name = req.body.employee.name,
        position = req.body.employee.position,
        wage = req.body.employee.wage,
        isCurrentlyEmployed = req.body.employee.isCurrentlyEmployed === 0 ? 0 : 1;
  if (!name || !position || !wage) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Employee SET name = $name, position = $position, ' +
      'wage = $wage, is_current_employee = $isCurrentlyEmployed ' +
      'WHERE id = $employeeId';
  const values = {
    $name: name,
    $position: position,
    $wage: wage,
    $isCurrentlyEmployed: isCurrentlyEmployed,
    $employeeId: req.params.employeeId
  };

  expressoDB.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      expressoDB.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});
//deletes an employee
employeesRouter.delete('/:employeeId', (req, res, next) => {
  const sql = 'UPDATE Employee SET is_current_employee = 0 WHERE Employee.id = $employeeId';
  const values = {$employeeId: req.params.employeeId};

  expressoDB.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      expressoDB.get(`SELECT * FROM Employee WHERE Employee.id = ${req.params.employeeId}`,
        (error, employee) => {
          res.status(200).json({employee: employee});
        });
    }
  });
});


module.exports = employeesRouter;
