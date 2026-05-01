const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getTasks = async (req, res) => {
  try {
    const { search, status, priority, projectId } = req.query;
    
    // Default: tasks assigned to the user or in projects they belong to
    let filter = {};

    if (projectId) {
      filter.project = projectId;
      // We should verify the user is a member of this project
      const project = await Project.findById(projectId);
      if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
      const isMember = project.members.some(m => m.user.toString() === req.user._id.toString());
      if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });
    } else {
      // Find all projects the user is part of
      const projects = await Project.find({ 'members.user': req.user._id }).select('_id');
      const projectIds = projects.map(p => p._id);
      filter.project = { $in: projectIds };
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    if (priority && priority !== 'all') {
      filter.priority = priority;
    }
    
    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('project', 'name')
      .sort({ createdAt: -1 });
    
    res.json({
      success: true,
      data: tasks,
      count: tasks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, project, assignee } = req.body;
    
    if (!project) {
       return res.status(400).json({ success: false, message: 'Project is required' });
    }

    // requireProjectAdmin middleware is applied to this route, so user is an admin.
    const task = await Task.create({
      title,
      description,
      status,
      priority,
      dueDate,
      project,
      assignee
    });
    
    res.status(201).json({
      success: true,
      data: task,
      message: 'Task created successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTask = async (req, res) => {
  try {
    let task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    
    // Check if user is member of project
    const project = await Project.findById(task.project);
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    
    if (!member) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this task' });
    }

    // Members can only update status if they are the assignee, Admins can do anything
    if (member.role !== 'admin' && task.assignee?.toString() !== req.user._id.toString()) {
       return res.status(403).json({ success: false, message: 'Only project admins or task assignees can update this task' });
    }
    
    task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    res.json({
      success: true,
      data: task,
      message: 'Task updated successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    
    // Only Admin can delete
    const project = await Project.findById(task.project);
    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    
    if (!member || member.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can delete tasks' });
    }
    
    await Task.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};