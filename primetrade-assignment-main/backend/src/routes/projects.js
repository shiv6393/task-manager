const express = require('express');
const { createProject, getProjects, getProject, addMember } = require('../controllers/projectControllers');
const { protect, requireProjectAdmin, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', authorize('admin'), createProject);
router.get('/', getProjects);
router.get('/:id', getProject);

router.post('/:id/members', requireProjectAdmin, addMember);

module.exports = router;
