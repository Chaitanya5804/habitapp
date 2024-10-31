import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCirclePlus, faHourglassHalf } from '@fortawesome/free-solid-svg-icons';
import AssignTasks from './AssignTasks'; 
import TaskStatus from './TaskStatus';
import './ClassDetails.css';

const ClassDetails = () => {
  const { classId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [classDetails, setClassDetails] = useState(null);
  const [activeTab, setActiveTab] = useState('home');
  const [error, setError] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  const handleLogoClick = () => {
    setActiveTab('home');
  };

  const fetchClassDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/class/${classId}`);
      setClassDetails(response.data);
    } catch (err) {
      console.error('Error fetching class details:', err);
      setError('Failed to fetch class details.');
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/class/${classId}/tasks`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks.');
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:5000/api/class/${classId}/task/${taskId}`);
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      console.error('Error deleting task:', err);
      setError('Failed to delete the task.');
    }
  };

  const editTask = (task) => {
    setEditingTask(task); 
  };

  const handleTaskEditChange = (field, value) => {
    setEditingTask({
      ...editingTask,
      [field]: value
    });
  };

  const handleTaskEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    try {
      const response = await axios.put(
        `http://localhost:5000/api/class/${classId}/task/${editingTask._id}`,
        {
          taskName: editingTask.taskName,
          description: editingTask.description,
          type: editingTask.type,
          duration: editingTask.type === 'habit' ? editingTask.duration : null,
          dueDate: editingTask.type === 'task' ? editingTask.dueDate : null,
        }
      );
      setTasks(tasks.map(task => (task._id === editingTask._id ? response.data.task : task)));
      setEditingTask(null); 
    } catch (err) {
      console.error('Error updating task:', err);
      setError('Failed to update the task.');
    }
  };

  useEffect(() => {
    if (activeTab === 'home') {
      fetchClassDetails();
      fetchTasks();
    }
  }, [classId, activeTab]);

  if (error) {
    return <div>{error}</div>;
  }

  if (!classDetails) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="navbar-logo" onClick={handleLogoClick}>
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="container-fluid">
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn" onClick={() => setActiveTab('assign')} data-title="Assign Task">
                  <FontAwesomeIcon icon={faFileCirclePlus} style={{ fontSize: '25px' }} />
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn" onClick={() => setActiveTab('status')} data-title="Task Status">
                  <FontAwesomeIcon icon={faHourglassHalf} style={{ fontSize: '25px' }} />
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="class-details">
        {activeTab === 'home' && (
          <div className="welcome-section">
            <h1>Welcome to {classDetails.groupName}</h1>
            <p>{classDetails.description}</p>
            <div className="task-list">
              <ul>
                {tasks.map(task => (
                  <li key={task._id} className="task-item">
                    {editingTask && editingTask._id === task._id ? (
                      <form className="edit-task-form" onSubmit={handleTaskEditSubmit}>
                        <input
                          type="text"
                          value={editingTask.taskName}
                          onChange={(e) => handleTaskEditChange('taskName', e.target.value)}
                          required
                        />
                        <textarea
                          value={editingTask.description}
                          onChange={(e) => handleTaskEditChange('description', e.target.value)}
                          required
                        ></textarea>
                        <select
                          value={editingTask.type}
                          onChange={(e) => handleTaskEditChange('type', e.target.value)}
                        >
                          <option value="task">Task</option>
                          <option value="habit">Habit</option>
                        </select>
                        {editingTask.type === 'habit' ? (
                          <input
                            type="number"
                            value={editingTask.duration}
                            onChange={(e) => handleTaskEditChange('duration', e.target.value)}
                            required
                          />
                        ) : (
                          <input
                            type="date"
                            value={editingTask.dueDate}
                            onChange={(e) => handleTaskEditChange('dueDate', e.target.value)}
                            required
                          />
                        )}
                        <button type="submit">Save</button>
                        <button type="button" onClick={() => setEditingTask(null)}>Cancel</button>
                      </form>
                    ) : (
                      <div className="task-content">
                        <h3>{task.taskName} - {task.type}</h3>
                        <p>Description: {task.description}</p>
                        <p>Assigned to: {task.assignTo}</p>
                        {task.type === 'habit' ? (
                          <p>Duration: {task.duration} days</p>
                        ) : (
                          <p>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
                        )}
                        <button className="edit-button" onClick={() => editTask(task)}>Edit</button>
                        <button className="delete-button" onClick={() => deleteTask(task._id)}>Delete</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
        <div className="tab-content">
          {activeTab === 'assign' && <AssignTasks classId={classId} />}
          {activeTab === 'status' && <TaskStatus classId={classId} />}
        </div>
      </div>
    </div>
  );
};

export default ClassDetails;
