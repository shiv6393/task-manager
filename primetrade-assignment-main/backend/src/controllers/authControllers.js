const User = require('../models/User');
const jwt = require('jsonwebtoken');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};


const sendError = (res, statusCode, message) => {
  return res.status(statusCode).json({
    success: false,
    message,
    error: true
  });
};


const sendSuccess = (res, statusCode, data, message = '') => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    
    if (!name || !email || !password) {
      return sendError(res, 400, 'Please provide name, email and password');
    }

   
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    
    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters long');
    }


    if (name.trim().length < 2) {
      return sendError(res, 400, 'Name must be at least 2 characters long');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return sendError(res, 409, 'An account with this email already exists. Please try logging in.');
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: role && ['admin', 'member'].includes(role) ? role : 'member'
    });

    const token = signToken(user._id);

    
    sendSuccess(res, 201, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }, 'Account created successfully!');

  } catch (error) {
    console.error('Registration error:', error);
    
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, errors.join(', '));
    }
    
   
    if (error.code === 11000) {
      return sendError(res, 409, 'An account with this email already exists.');
    }

    sendError(res, 500, 'Something went wrong during registration. Please try again.');
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Please provide both email and password');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please provide a valid email address');
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    
    if (!user) {
      return sendError(res, 401, 'LOGIN_ERROR: No account found with this email address');
    }

    const isPasswordCorrect = await user.correctPassword(password, user.password);
    if (!isPasswordCorrect) {
      return sendError(res, 401, 'LOGIN_ERROR: Incorrect password');
    }

    const token = signToken(user._id);

    sendSuccess(res, 200, {
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    }, 'Login successful!');

  } catch (error) {
    console.error('Login error:', error);
    sendError(res, 500, 'Something went wrong during login. Please try again.');
  }
};

exports.getProfile = async (req, res) => {
  try {
   
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    sendSuccess(res, 200, {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, 'Profile retrieved successfully');

  } catch (error) {
    console.error('Profile error:', error);
    sendError(res, 500, 'Failed to fetch profile information.');
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updates = {};

    if (name) {
      if (name.trim().length < 2) {
        return sendError(res, 400, 'Name must be at least 2 characters long');
      }
      updates.name = name.trim();
    }

    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return sendError(res, 400, 'Please provide a valid email address');
      }
      
     
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user.id }
      });
      
      if (existingUser) {
        return sendError(res, 409, 'Email is already taken');
      }
      updates.email = email.toLowerCase().trim();
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    );

    sendSuccess(res, 200, {
      id: user._id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }, 'Profile updated successfully');

  } catch (error) {
    console.error('Update profile error:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return sendError(res, 400, errors.join(', '));
    }
    
    if (error.code === 11000) {
      return sendError(res, 409, 'Email is already taken');
    }

    sendError(res, 500, 'Failed to update profile.');
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return sendError(res, 400, 'Please provide current and new password');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'New password must be at least 6 characters long');
    }

    const user = await User.findById(req.user.id).select('+password');
    
    const isCurrentPasswordCorrect = await user.correctPassword(currentPassword, user.password);
    if (!isCurrentPasswordCorrect) {
      return sendError(res, 401, 'Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    sendSuccess(res, 200, null, 'Password changed successfully');

  } catch (error) {
    console.error('Change password error:', error);
    sendError(res, 500, 'Failed to change password.');
  }
};