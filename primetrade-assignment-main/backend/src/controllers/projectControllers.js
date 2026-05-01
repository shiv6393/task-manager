const Project = require('../models/Project');
const User = require('../models/User');

exports.createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const project = await Project.create({
      name,
      description,
      createdBy: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }]
    });

    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ 'members.user': req.user._id }).populate('members.user', 'name email');
    res.status(200).json({ success: true, data: projects });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate('members.user', 'name email');
    if (!project) return res.status(404).json({ success: false, message: 'Project not found' });
    
    const isMember = project.members.some(m => m.user._id.toString() === req.user._id.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member' });

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    // Requires requireProjectAdmin middleware
    const { email, role } = req.body;
    const project = req.project; // From middleware

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found' });

    const isAlreadyMember = project.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (isAlreadyMember) return res.status(400).json({ success: false, message: 'User is already a member' });

    project.members.push({ user: userToAdd._id, role: role || 'member' });
    await project.save();

    res.status(200).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};
