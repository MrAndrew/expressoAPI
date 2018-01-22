const express = require('express');
const menusRouter = express.Router();

const sqlite3 = require('sqlite3');
const expressoDB = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite'); //maybe change the path

const menuItemsRouter = require('./menu-items.js');

//param checks for valid menu with menuId supplied in url request
menusRouter.param('menuId', (req, res, next, menuId) => {
  const sql = 'SELECT * FROM Menu WHERE id = $menuId';
  const values = {$menuId: menuId};
  expressoDB.get(sql, values, (error, menu) => {
    if (error) {
      next(error);
    } else if (menu) {
      req.menu = menu;
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

menusRouter.use('/:menuId/menu-items', menuItemsRouter);

//get all current menus
menusRouter.get('/', (req, res, next) => {
  expressoDB.all('SELECT * FROM Menu',
    (err, menus) => {
      if (err) {
        next(err);
      } else {
        res.status(200).json({menus: menus});
      }
    });
});
//get menu by id
menusRouter.get('/:menuId', (req, res, next) => {
  res.status(200).json({menu: req.menu});
});
//post a new menu
menusRouter.post('/', (req, res, next) => {
  const title = req.body.menu.title;
  if (!title) {
    return res.sendStatus(400);
  }

  const sql = 'INSERT INTO Menu (title)' +
      'VALUES ($title)';
  const values = {
    $title: title,
  };
//creates and sends back the new Menu from sql table to the client as a json object
  expressoDB.run(sql, values, function(error) {
    if (error) {
      next(error);
    } else {
      expressoDB.get(`SELECT * FROM Menu WHERE Menu.id = ${this.lastID}`,
        (error, menu) => {
          res.status(201).json({menu: menu});
        });
    }
  });
});
//updates a menu
menusRouter.put('/:menuId', (req, res, next) => {
  const title = req.body.menu.title;
  const menuId = req.params.menuId;
  if (!title || !menuId) {
    return res.sendStatus(400);
  }

  const sql = 'UPDATE Menu SET title = $title WHERE id = $menuId';
  const values = {
    $title: title,
    $menuId: req.params.menuId
  };
//updates and sends back the menu from sql table to the client as a json object
  expressoDB.run(sql, values, (error) => {
    if (error) {
      next(error);
    } else {
      expressoDB.get(`SELECT * FROM Menu WHERE Menu.id = ${req.params.menuId}`,
        (error, menu) => {
          res.status(200).json({menu: menu});
        });
    }
  });
});
//deletes a menu
menusRouter.delete('/:menuId', (req, res, next) => {
  const menuSql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
  const menuItemsValues = {$menuId: req.params.menuId};
  expressoDB.get(menuSql, menuItemsValues, (error, menuItems) => {
    if (error) {
      next(error);
    } else if (menuItems) {
      res.sendStatus(400);
    } else {
      const deleteSql = 'DELETE FROM Menu WHERE Menu.id = $menuId';
      const deleteValue = {$menuId: req.params.menuId};

      expressoDB.get(deleteSql, deleteValue, (error) => {
        if (error) {
          next(error);
        }
          res.status(204).send();
      });
    }
  });
});

module.exports = menusRouter;
