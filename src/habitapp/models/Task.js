const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  taskName: { type: String, required: true },
  description: { type: String, required: true },
  type: { type: String, enum: ['habit', 'task'], required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  assignTo: { type: String, required: true },
  duration: { type: Number, default: null },
  dueDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;
