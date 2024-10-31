import React, { useState } from 'react';
import axios from 'axios';

const AssignTasks = ({ classId }) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('habit'); 
  const [duration, setDuration] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [assignTo, setAssignTo] = useState('all'); 
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const taskData = {
      taskName,
      description,
      type,
      classId,
      assignTo,
      ...(type === 'habit' ? { duration } : { dueDate }),
    };

    try {
      const response = await axios.post(`http://localhost:5000/api/class/${classId}/assign-task`, taskData);
      setMessage(response.data.message);
      setTaskName('');
      setDescription('');
      setType('habit');
      setDuration('');
      setDueDate('');
      setAssignTo('all');
    } catch (error) {
      console.error('Error assigning task:', error);
      setMessage('Failed to assign the task.');
    }
  };

  return (
    <div className="assign-task-form">
      <h2>Assign a New Task</h2>
      {message && <p className="message">{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Task Name:</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Type:</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="habit">Habit</option>
            <option value="task">Task</option>
          </select>
        </div>
        {type === 'habit' && (
          <div>
            <label>Duration (in days):</label>
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        )}

        {type === 'task' && (
          <div>
            <label>Due Date:</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
        )}
        <div>
          <label>Assign To (Email or Username):</label>
          <input
            type="text"
            value={assignTo}
            onChange={(e) => setAssignTo(e.target.value)}
            placeholder="Type 'all' for all users"
            required
          />
        </div>
        <button type="submit">Assign Task</button>
      </form>
    </div>
  );  
};

export default AssignTasks;