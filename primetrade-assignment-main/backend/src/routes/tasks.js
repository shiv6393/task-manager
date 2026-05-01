const express = require('express');
const { 
  getTasks, 
  createTask, 
  updateTask, 
  deleteTask 
} = require('../controllers/taskControllers.js');
const { protect, requireProjectAdmin } = require('../middleware/auth.js');

const router = express.Router();

router.route('/')
  .get(protect, getTasks)
  .post(protect, requireProjectAdmin, createTask);

router.route('/:id')
  .put(protect, updateTask)
  .delete(protect, deleteTask);

module.exports = router;