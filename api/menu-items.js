const express = require('express');
const menuItemsRouter = express.Router({mergeParams: true});

const sqlite3 = require('sqlite3');
const expressoDB = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite'); //maybe change the path

//parm checks for valid MenuItems from the menuItemId in the url request
menuItemsRouter.param('menuItemId', (req, res, next, menuItemId) => {
  const sql = 'SELECT * FROM MenuItem WHERE id = $menuItemId';
  const values = {$menuItemId: menuItemId};
  expressoDB.get(sql, values, (error, menuitem) => {
    if (error) {
      next(error);
    } else if (menuitem) {
      next();
    } else {
      res.sendStatus(404);
    }
  });
});

//Get menuitems and returns as a json object
menuItemsRouter.get('/', (req, res, next) => {
  const sql = 'SELECT * FROM MenuItem WHERE menu_id = $menuId';
  const values = { $menuId: req.params.menuId};
  expressoDB.all(sql, values, (error, menuitems) => {
    if (error) {
      next(error);
    } else {
      if (!menuitems) {
        res.status(200).json({});
      } else {
      res.status(200).json({menuItems: menuitems});
      }
    }
  });
});
//post a new menu item
menuItemsRouter.post('/', (req, res, next) => {
  const name = req.body.menuItem.name,
        inventory = req.body.menuItem.inventory,
        description = req.body.menuItem.description,
        price = req.body.menuItem.price,
        menuId = req.params.menuId;
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValues = {$menuId: menuId};
  expressoDB.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!name || !inventory || !price || !menuId) {
        return res.sendStatus(400);
      }

      const sql = 'INSERT INTO MenuItem (name, inventory, description, price, menu_id)' +
          'VALUES ($name, $inventory, $description, $price, $menuId)';
      const values = {
        $name: name,
        $inventory: inventory,
        $description: description,
        $price: price,
        $menuId: req.params.menuId
      };
//creates and sends back the menu item from sql table to the client as a json object
      expressoDB.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          expressoDB.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${this.lastID}`,
            (error, menuItem) => {
              res.status(201).json({menuItem: menuItem});
            });
        }
      });
    }
  });
}); //ends POST route
//update a current menu item
menuItemsRouter.put('/:menuItemId', (req, res, next) => {
  const name = req.body.menuItem.name,
        inventory = req.body.menuItem.inventory,
        description = req.body.menuItem.description,
        price = req.body.menuItem.price,
        menuId = req.params.menuId,
        menuItemId = req.params.menuItemId;
  const menuSql = 'SELECT * FROM Menu WHERE Menu.id = $menuId';
  const menuValues = {$menuId: menuId};
  expressoDB.get(menuSql, menuValues, (error, menu) => {
    if (error) {
      next(error);
    } else {
      if (!name || !inventory || !price) {
        return res.sendStatus(400);
      }

      const sql = 'UPDATE MenuItem SET name = $name, inventory = $inventory, menu_id = $menuId, ' +
          'description = $description, price = $price ' +
          'WHERE MenuItem.id = $menuItemId';
      const values = {
        $name: name,
        $inventory: inventory,
        $description: description,
        $price: price,
        $menuId: menuId,
        $menuItemId: menuItemId
      };
//updates and sends back the menu item from sql table to the client as a json object
      expressoDB.run(sql, values, function(error) {
        if (error) {
          next(error);
        } else {
          expressoDB.get(`SELECT * FROM MenuItem WHERE MenuItem.id = ${req.params.menuItemId}`,
            (error, menuItem) => {
              res.status(200).json({menuItem: menuItem});
            });
        }
      });
    }
  });
});
//delets an existing menu item
menuItemsRouter.delete('/:menuItemId', (req, res, next) => {
 const deleteSql = 'DELETE FROM MenuItem WHERE MenuItem.id = $menuItemId';
 const deleteValues = {$menuItemId: req.params.menuItemId};
 expressoDB.run(deleteSql, deleteValues, (error) => {
   if (error) {
     next(error);
   } else {
     res.sendStatus(204);
   }
 });
});//end delete route

module.exports = menuItemsRouter;
