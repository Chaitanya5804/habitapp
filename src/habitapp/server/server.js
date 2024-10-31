const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const faceapi = require('face-api.js');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const Group = require('../models/Group');
const Invitation = require('../models/Invitation');
const Task = require('../models/Task'); 
const UserTaskStatus = require('../models/UserTaskStatus');
const habitScheduler = require('../components/habitSchedular');

const app = express();
app.use(express.json());
app.use(cors());
const JWT_SECRET = 'habitapp'; 

mongoose.connect('mongodb://localhost/habitapp');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, required: true },
  faceDescriptor: { type: Array, required: true },
  classes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Group' }]
});
const User = mongoose.model('User', userSchema);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chaitanyadeepika5804@gmail.com', 
    pass: 'gvds qbbx ekqk aycz',  
  },
});

app.post('/api/create-group', async (req, res) => {
  const { groupName, description, adminId } = req.body;

  // Validate input
  if (!groupName) {
    return res.status(400).send({ error: 'Group name is required' });
  }

  try {
    const admin = await User.findById(adminId);
    if (!admin || admin.role !== 'admin') {
      return res.status(403).send({ error: 'You are not authorized to create a group' });
    }

    const inviteCode = crypto.randomBytes(4).toString('hex'); // 8-character code
    const inviteLink = `http://localhost:3000/invite/${inviteCode}`;

    const group = new Group({
      groupName,
      description,
      inviteLink,
      inviteCode,
      createdBy: admin._id,
      createdAt: Date.now(),
    });

    await group.save();

    res.status(201).json({ message: 'Group created successfully', inviteLink, inviteCode });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error. Could not create group.' });
  }
});

app.get('/api/get-invitations/:adminId', async (req, res) => {
  const { adminId } = req.params;
  
  try {
    const invitations = await Group.find({ createdBy: adminId });
    res.status(200).json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).send({ error: 'Server error. Could not fetch invitations.' });
  }
});

app.delete('/api/delete-group/:id', async (req, res) => {
  const groupId = req.params.id;

  try {
    await Group.findByIdAndDelete(groupId); // Ensure that the groupId is correct
    res.status(200).json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Error deleting group' });
  }
});

app.post('/api/invite-user', async (req, res) => {
  const { email, className, description, classCode, invitedById } = req.body;
  if (!email || !className || !description||  !classCode || !invitedById) {
    console.log('all fields are not there');
    return res.status(400).send({ error: 'All fields are required.' });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).send({ error: 'Invalid email format.' });
  }

  try {
    const inviter = await User.findById(invitedById);
    if (!inviter) {
      return res.status(404).send({ error: 'Inviter not found.' });
    }
    if (inviter.role !== 'admin') {
      return res.status(403).send({ error: 'Only admins can send invitations.' });
    }

    const invitation = new Invitation({
      className,
      description,
      classCode,
      invitedBy: inviter._id,
      invitedUserEmail: email,
    });

    await invitation.save();

    let user = await User.findOne({ email });

    if (user) {
      if (!user.invitations) {
        user.invitations = []; 
      }
      user.invitations.push(invitation._id);
      await user.save();
    } else {
      user = new User({ email, invitations: [invitation._id], role: 'user' });
      await user.save();
    }

    // Send email with invitation link
    const inviteLink = `http://localhost:3000/join-class/${classCode}`;
    await sendInvitationEmail(email, className,description,inviteLink, classCode);

    return res.status(200).send({ message: 'Invitation sent successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error.' });
  }
});

const sendInvitationEmail = async (email, className,description,inviteLink, inviteCode) => {
  const mailOptions = {
    from: 'chaitanyadeepika5804@gmail.com',
    to: email,
    subject: `Invitation to join ${className}`,
    html: `<p>You have been invited to join the class <b>${className}</b>.</p>
           <p>Class Description: <b>${description}</b>.</p>
           <p>Class Code: ${inviteCode}.</p>
           <p>Class Link <a href="${inviteLink}">Join Class</a></p>`,
  };

  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return reject(new Error('Error sending invitation email'));
      }
      resolve(info);
    });
  });
};

app.get('/api/get-user-invitations/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    const userinvitations  = await Invitation.find({invitedUserEmail:user.email});
    if (!user) {
      return res.status(404).send({ error: 'User not found.' });
    }
    res.status(200).send(userinvitations);
  } catch (error) {
    console.error(error);
    res.status(500).send({ error: 'Server error.' });
  }

});

app.post('/api/user/join-class/:classCode', async (req, res) => {
  const { classCode } = req.params;
  const { userId } = req.body; 
  try {
    const group = await Group.findOne({ inviteCode: classCode });
    if (!group) {
      return res.status(404).json({ error: 'Class not found' });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (!user.classes.includes(group._id)) {
      user.classes.push(group._id);
      await user.save();
    }

    await Invitation.updateOne(
      { classCode, invitedUserEmail: user.email },
      { $set: { status: 'joined' } } 
    );

    res.status(200).json({ message: 'Joined class successfully' });
  } catch (error) {
    console.error('Error joining class:', error);
    res.status(500).json({ error: 'Failed to join class' });
  }
});

app.get('/api/user/classes/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('classes');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json(user.classes);
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

app.get('/api/admin/joined-users/:adminId', async (req, res) => {
  const { adminId } = req.params;

  try {
    const groups = await Group.find({ createdBy: adminId });
    const groupIds = groups.map(group => group._id);

    if (groupIds.length === 0) {
      return res.status(404).json({ message: 'No classes found for this admin.' });
    }
    const joinedUsers = await User.find({ classes: { $in: groupIds } });

    if (joinedUsers.length === 0) {
      return res.status(404).json({ message: 'No users have joined your classes yet.' });
    }

    return res.status(200).json(joinedUsers);
  } catch (error) {
    console.error('Error fetching joined users:', error);
    return res.status(500).json({ error: 'Failed to fetch joined users.' });
  }
});

app.get('/api/class/:classId', async (req, res) => {
  const { classId } = req.params;

  try {
    const group = await Group.findById(classId);
    console.log(group);
    if (!group) {
      return res.status(404).json({ error: 'Class not found' });
    }
    res.status(200).json({
      groupName: group.groupName,
      description: group.description,
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    res.status(500).json({ error: 'Failed to fetch class details.' });
  }
});

app.post('/api/signup', async (req, res) => {
  const { username, email, password, role, faceDescriptor } = req.body;
  console.log(req.body);
  if (!faceDescriptor) {
    return res.status(400).json({ errors: { face: 'Face descriptor is required.' } });
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const user = new User({ 
    username, 
    email,
    password: hashedPassword, 
    role, 
    faceDescriptor 
  });

  try {
    await user.save();
    console.log('User registered:', user); // Debugging: Log user data after saving
    res.status(201).send({ message: "Signup successful!" });
  } catch (err) {
    console.error(err); // Debugging: Log errors
    res.status(400).send({ errors: { username: "Username already exists or another error occurred" } });
  }
});

app.post('/api/request-reset-password', async (req, res) => {
  const { email } = req.body;
  console.log(req.body);

  const user = await User.findOne({ email });
  console.log(user.email);
  if (!user) {
    return res.status(400).send({ errors: { email: 'User not found' } });
  }

  const token = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '1h' });
  const resetLink = `http://localhost:3000/reset-password/${token}`;

  const mailOptions = {
    from: 'chaitanyadeepika5804@gmail.com',
    to: user.email,
    subject: 'Password Reset Request',
    text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
      return res.status(500).send({ message: 'Error sending email', error });
    } else {
      console.log('Email sent:', info.response);
      return res.status(200).send(
        { message: 'A password reset link has been sent to your email address. Please check your email and follow the instructions to reset your password.' }
      );
    }
  });
});

app.post('/api/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  console.log(token);
  const { newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, JWT_SECRET); 
    const user = await User.findOne({ email: decoded.email });

    if (!user) {
      return res.status(400).send({ errors: { email: 'Invalid token or user not found' } });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    return res.status(200).send({ message: 'Password reset successfully!' });
  } catch (error) {
    return res.status(400).send({ message: 'Invalid or expired token' });
  }
});

app.post('/api/login-face', async (req, res) => {
  const { usernameOrEmail, role, faceDescriptor } = req.body;
  
  const user = await User.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail }, 
    ],
    role,
  });

  if (!user) {
    return res.status(400).send({ errors: { usernameOrEmail: "Username or role is incorrect" } });
  }

  const storedDescriptor = new Float32Array(user.faceDescriptor);
  const inputDescriptor = new Float32Array(faceDescriptor);
  console.log(inputDescriptor);

  if (storedDescriptor.length !== inputDescriptor.length) {
    return res.status(400).send({ errors: { face: 'Face descriptor lengths do not match' } });
  }

  const distance = faceapi.euclideanDistance(storedDescriptor, inputDescriptor);

  if (distance < 0.6) {
    const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    return res.status(200).send({ success: true, token, user });
  } else {
    return res.status(400).send({ errors: { face: 'Face does not match. Try again.' } });
  }
});

app.post('/api/login', async (req, res) => {
  const { usernameOrEmail, password, role } = req.body;

  if (!usernameOrEmail || !password || !role) {
    return res.status(400).send({
      errors: {
        usernameOrEmail: !usernameOrEmail ? 'Username or email is required' : '',
        password: !password ? 'Password is required' : '',
        role: !role ? 'Role is required' : '',
      },
    });
  }

  // Check if the user entered a username or an email
  const user = await User.findOne({
    $or: [
      { username: usernameOrEmail },
      { email: usernameOrEmail }, // assuming email is stored in the database
    ],
    role,
  });

  if (!user) {
    return res.status(400).send({
      errors: { usernameOrEmail: 'Check your username or email and role' },
    });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(400).send({ errors: { password: 'Invalid password' } });
  }

  const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '1h' });

  res.status(200).send({ success: true, token , user});
});

app.get('/api/class/:classId/tasks', async (req, res) => {
  const { classId } = req.params;
  try {
    const tasks = await Task.find({ classId });
    res.status(200).json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.delete('/api/class/:classId/task/:taskId', async (req, res) => {
  const { taskId } = req.params;

  try {
    await Task.findByIdAndDelete(taskId);
    await UserTaskStatus.deleteMany({ taskId });

    res.status(200).json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete the task' });
  }
});

app.post('/api/class/:classId/assign-task', async (req, res) => {
  const { classId } = req.params;
  const { taskName, description, type, duration, dueDate, assignTo } = req.body;

  try {
    const newTask = new Task({
      taskName,
      description,
      type,
      classId,
      assignTo: assignTo === 'all' ? 'all' : assignTo,
      duration: type === 'habit' ? duration : null,
      dueDate: type === 'task' ? dueDate : null,
    });

    await newTask.save();

    if (assignTo === 'all') {
      const classMembers = await User.find({ classes: classId });
      console.log('cm = ', classMembers);
      const userTaskStatusEntries = classMembers.map(member => ({
        userId: member._id,
        userName: member.username,
        taskId: newTask._id,
        status: 'pending',
      }));
      await UserTaskStatus.insertMany(userTaskStatusEntries);
    } else {
      const user = await User.findOne({ $or: [{ email: assignTo }, { username: assignTo }] });

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const userTaskStatus = new UserTaskStatus({
        userId: user._id,
        taskId: newTask._id,
        status: 'pending',
      });

      await userTaskStatus.save();
    }

    res.status(201).json({ message: 'Task assigned successfully', task: newTask });
  } catch (error) {
    console.error('Error assigning task:', error);
    res.status(500).json({ error: 'Failed to assign task' });
  }
});

app.put('/api/class/:classId/task/:taskId', async (req, res) => {
  const { taskId } = req.params;
  const { taskName, description, type, duration, dueDate } = req.body;

  try {
    const updatedTask = await Task.findByIdAndUpdate(
      taskId,
      {
        taskName,
        description,
        type,
        duration: type === 'habit' ? duration : null,
        dueDate: type === 'task' ? dueDate : null,
      },
      { new: true }
    );

    if (!updatedTask) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    res.status(200).json({ message: 'Task updated successfully', task: updatedTask });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update the task' });
  }
});

app.get('/api/class/:classId/task-status', async (req, res) => {
  const { classId } = req.params;

  try {
    const tasks = await Task.find({ classId });

    if (tasks.length === 0) {
      return res.status(200).json([]);
    }
    const taskIds = tasks.map(task => task._id);
    const userTaskStatuses = await UserTaskStatus.find({ taskId: { $in: taskIds } });
    const userIds = [...new Set(userTaskStatuses.map(status => status.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } });
    const data = users.map(user => {
      const userTasks = tasks
        .filter(task => {
          return userTaskStatuses.some(status => 
            status.userId.toString() === user._id.toString() &&
            status.taskId.toString() === task._id.toString()
          );
        })
        .map(task => {
          const userStatus = userTaskStatuses.find(status =>
            status.userId.toString() === user._id.toString() &&
            status.taskId.toString() === task._id.toString()
          );

          return {
            taskName: task.taskName,
            status: userStatus ? userStatus.status : 'pending',
          };
        });

      return {
        userId: user._id,
        userName: user.username,
        tasks: userTasks
      };
    });

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching task statuses:', error);
    res.status(500).json({ error: 'Failed to fetch task statuses' });
  }
});

app.get('/api/user/:userId/tasks', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const tasks = await Task.find({
      $or: [
        { assignTo: user.username },
        { assignTo: user.email },
        { assignTo: 'all', classId: { $in: user.classes } },
      ]
    }).populate('classId', 'groupName');
    const userTaskStatuses = await UserTaskStatus.find({ userId });
    const statusMap = userTaskStatuses.reduce((map, status) => {
      map[status.taskId] = status.status;
      return map;
    }, {});
    const tasksWithStatus = tasks.map(task => ({
      ...task._doc,
      status: statusMap[task._id] || 'pending',
    }));

    res.status(200).json(tasksWithStatus);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/user/:userId/complete-task/:taskId', async (req, res) => {
  const { userId, taskId } = req.params;
  try {
    let taskStatus = await UserTaskStatus.findOne({ userId, taskId });

    if (!taskStatus) {
      taskStatus = new UserTaskStatus({
        userId,
        taskId,
        status: 'completed',
        completedAt: new Date(),
      });
    } else {
      taskStatus.status = 'completed';
      taskStatus.completedAt = new Date();
    }

    await taskStatus.save();
    res.status(200).json({ message: 'Task marked as completed' });
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));

habitScheduler.regenerateHabits();