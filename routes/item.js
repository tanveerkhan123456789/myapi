const express = require('express');
const router = express.Router();
const Item = require('../Models/item');

// Create an item
router.post('/', async (req, res) => {
    if(!req.body)
    {
      return  res.status(404).json({ message:"user data not found" });

    }
  const { name, description, price } = req.body;

  try {
    const newItem = new Item({ name, description, price });
    const savedItem = await newItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
    throw err; // Propagate error to handle it accordingly

  }

});

// Get all items
router.get('/', async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single item by ID
router.get('/:id', getItem, (req, res) => {
  res.json(res.item);
});

// Update an item
router.put('/:id', getItem, async (req, res) => {
  const { name, description, price } = req.body;

  if (name != null) res.item.name = name;
  if (description != null) res.item.description = description;
  if (price != null) res.item.price = price;

  try {
    const updatedItem = await res.item.save();
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an item
router.delete('/:id', getItem, async (req, res) => {
  try {
    await res.item.remove();
    res.json({ message: 'Deleted item' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Middleware to get item by ID
async function getItem(req, res, next) {
  let item;
  try {
    item = await Item.findById(req.params.id);
    if (item == null) {
      return res.status(404).json({ message: 'Cannot find item' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.item = item;
  next();
}

module.exports = router;
