const cron = require('node-cron');
const Task = require('../models/Task');
const UserTaskStatus = require('../models/UserTaskStatus');

const regenerateHabits = async () => {
  try {
    const currentTime = new Date();

    const habitTasks = await Task.find({ type: 'habit', duration: { $ne: null } });

    for (const habitTask of habitTasks) {
      const { _id: taskId, duration, createdAt } = habitTask;

      const expirationTime = new Date(createdAt);
      expirationTime.setDate(expirationTime.getDate() + duration);

      if (currentTime < expirationTime) {
        const updatedStatuses = await UserTaskStatus.updateMany(
          { taskId },
          {
            $set: {
              status: 'pending',
              completedAt: null
            }
          }
        );

        console.log(`Regenerated ${updatedStatuses.nModified} habit statuses for task ${taskId}`);
      } else {
        console.log(`Habit task ${taskId} has expired and will not be regenerated.`);
      }
    }

    console.log(`Habit regeneration completed at ${currentTime}`);
  } catch (error) {
    console.error('Error regenerating habits:', error);
  }
};

cron.schedule('*/3 * * * *', () => {
  console.log('Running the habit regeneration task...');
  regenerateHabits();
});

module.exports = { regenerateHabits };
