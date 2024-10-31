const mongoose = require('mongoose');

const invitationSchema = new mongoose.Schema({
    className: String,
    description:String,
    classCode: String,
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    invitedUserEmail: String,
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  });

const Invitation = mongoose.model('Invitation', invitationSchema);
module.exports = Invitation;
      