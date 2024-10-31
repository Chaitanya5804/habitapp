const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique:true },
  description: { type: String },
  inviteLink: { type: String, required: true },
  inviteCode: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});
const Group = mongoose.model('Group', groupSchema);
module.exports = Group;
    