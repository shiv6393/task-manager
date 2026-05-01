const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

const protect = async (req, res, next) => {
  try {
    let token;
    
   
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

   
    else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'ACCESS_DENIED: No authentication token provided',
        error: true
      });
    }

    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'SESSION_EXPIRED: User no longer exists',
        error: true
      });
    }

    
    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);

    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'SESSION_EXPIRED: Invalid authentication token',
        error: true
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'SESSION_EXPIRED: Authentication token has expired',
        error: true
      });
    }

    
    return res.status(401).json({
      success: false,
      message: 'SESSION_EXPIRED: Not authorized to access this route',
      error: true
    });
  }
};


const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'ACCESS_DENIED: Not authorized to access this route',
        error: true
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `ACCESS_DENIED: User role ${req.user.role} is not authorized to access this route`,
        error: true
      });
    }

    next();
  };
};


const optionalAuth = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (user) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    
    next();
  }
};

const requireProjectAdmin = async (req, res, next) => {
  try {
    const projectId = req.params.id || req.body.project;
    if (!projectId) {
      return res.status(400).json({ success: false, message: 'Project ID is required' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const member = project.members.find(m => m.user.toString() === req.user._id.toString());
    if (!member) {
      return res.status(403).json({ success: false, message: 'You are not a member of this project' });
    }

    if (member.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Only project admins can perform this action' });
    }

    req.project = project; // Pass project down
    next();
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error checking project admin' });
  }
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireProjectAdmin
};