import React, { useState, useEffect } from 'react';
import axios from 'axios';

const TaskStatus = ({ classId }) => {
  const [taskStatusData, setTaskStatusData] = useState([]);
  const [error, setError] = useState(null);
  const fetchTaskStatus = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/class/${classId}/task-status`);
      setTaskStatusData(response.data);
    } catch (err) {
      console.error('Error fetching task status:', err);
      setError('Failed to fetch task status.');
    }
  };
  useEffect(() => {
    fetchTaskStatus();
  }, [classId]);
  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Task Status</h2>
      <p>Here you can see the status of the tasks (completed, pending) for each user in the class.</p>
      
      <table className="task-status-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Task Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {taskStatusData.length === 0 ? (
            <tr>
              <td colSpan="3">No task statuses available.</td>
            </tr>
          ) : (
            taskStatusData.map(userData => (
              userData.tasks.map((task, index) => (
                <tr key={`${userData.userId}-${index}`}>
                  {index === 0 && (
                    <td rowSpan={userData.tasks.length}>
                      {userData.userName}
                    </td>
                  )}
                  <td>{task.taskName}</td>
                  <td>{task.status}</td>
                </tr>
              ))
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TaskStatus;
