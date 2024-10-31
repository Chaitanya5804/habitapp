import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './UserDashboard.css';

const UserDashboard = () => {
  const [invitations, setInvitations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('tasks');

  const location = useLocation();
  const navigate = useNavigate();
  const username = location.state?.name; 
  const userId = location.state.id;

  useEffect(() => {
    fetchInvitations();
    fetchClasses();
    fetchTasks();
  }, [userId]);

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/get-user-invitations/${userId}`);
      const pendingInvitations = response.data.filter(invitation => invitation.status === 'pending');
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

    const handleJoinFromInvitation = async (invitationId, classCode,userId) => {
      try {
        await axios.post(`http://localhost:5000/api/user/join-class/${classCode}`, { userId });
        setInvitations(invitations.filter(invite => invite._id !== invitationId)); 
        setClasses([...classes, { classCode }]); 
        setSuccess('Successfully joined the class!');
      } catch (error) {
        console.error('Error joining class from invitation:', error);
        setError('Failed to join the class.');
      }
    };

  const fetchClasses = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/user/classes/${userId}`);
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/user/${userId}/tasks`);
      setTasks(response.data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks.');
    }
  };

  const handleJoinClass = async () => {
    if (!classCode) {
      setError('Class code is required.');
      return;
    }

    try {
      await axios.post(`http://localhost:5000/api/user/join-class/${classCode}`, { userId });
      fetchClasses(); // Refresh the list of classes
      setClassCode('');
      setSuccess('Successfully joined the class!');
      setError('');
    } catch (error) {
      console.error('Error joining class via class code:', error);
      setError('Failed to join the class with the given code.');
    }
  };

    const completeTask = async (taskId) => {
      try {
        await axios.post(`http://localhost:5000/api/user/${userId}/complete-task/${taskId}`);
        setTasks(tasks.map(task => 
          task._id === taskId ? { ...task, status: 'completed' } : task
        ));
      } catch (err) {
        console.error('Error completing task:', err);
        setError('Failed to mark task as completed.');
      }
    };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const habitTasks = tasks.filter(task => task.type === 'habit');
  const regularTasks = tasks.filter(task => task.type === 'task');

  return (
    <div className="user-dashboard">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container-fluid">
          <div className="navbar-logo" onClick={() => setActiveTab('tasks')}>
            <img src="/images/logo.png" alt="Logo" />
          </div>
          <div className="navbar-nav ms-auto">
            <button 
              className={`nav-link btn ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              Tasks
            </button>
            <button 
              className={`nav-link btn ${activeTab === 'habits' ? 'active' : ''}`}
              onClick={() => setActiveTab('habits')}
            >
              Habits
            </button> 
            <button 
              className={`nav-link btn ${activeTab === 'classes' ? 'active' : ''}`}
              onClick={() => setActiveTab('classes')}
            >
              Your Classes
            </button>
            <button 
              className={`nav-link btn ${activeTab === 'invitations' ? 'active' : ''}`}
              onClick={() => setActiveTab('invitations')}
            >
              Your Invitations
            </button>
            <button className="nav-link btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="content">
        <h1>Welcome, {username}</h1>
        {activeTab === 'habits' && (
          <div className="habit-tasks">
            <h2>Habits</h2>
            {habitTasks.length === 0 ? (
              <p>No habits assigned.</p>
            ) : (
              <ul>
                {habitTasks.map(habit => (
                  <li key={habit._id}>
                    <strong>{habit.taskName} - {habit.classId?.groupName || 'N/A'} Class</strong>
                    <p>{habit.description}</p>
                    <p>Duration: {habit.duration} days</p>
                    {habit.status !== 'completed' ? (
                      <button onClick={() => completeTask(habit._id)}>Complete Habit</button>
                    ) : (
                      <p>Status: Completed</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="regular-tasks">
            <h4>Your Tasks</h4>
            {regularTasks.length === 0 ? (
              <p>No tasks assigned.</p>
            ) : (
              <ul>
                {regularTasks.map(task => (
                  <li key={task._id}>
                    <strong>{task.taskName} - {task.classId?.groupName || 'N/A'} Class</strong>
                    <p>{task.description}</p>
                    <p>Due Date: {new Date(task.dueDate).toLocaleDateString()}</p>
                    {task.status !== 'completed' ? (
                      <button onClick={() => completeTask(task._id)}>Submit Task</button>
                    ) : (
                      <p>Status: Completed</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="classes-section">
            <h2>Your Classes</h2>
            <div className="join-class">
              <h2>Join a Class via Class Code</h2>
              <input
                type="text"
                placeholder="Enter class code"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
              />
              <button onClick={handleJoinClass}>Join Class</button>
              {error && <p className="error">{error}</p>}
              {success && <p className="success">{success}</p>}
            </div>
            {classes.length === 0 ? (
              <p>You have not joined any classes yet.</p>
            ) : (
              <ul>
                {classes.map(classItem => (
                  <li key={classItem._id}>
                    <strong>{classItem.groupName}</strong>: {classItem.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === 'invitations' && (
          <div className="invitations-section">
            <h2>Your Invitations</h2>
            {invitations.length === 0 ? (
              <p>No invitations found.</p>
            ) : (
              <ul>
                {invitations.map(invitation => (
                  <li key={invitation._id}>
                    <p><strong>Class Name:</strong> {invitation.className}</p>
                    <p><strong>Description:</strong> {invitation.description}</p>
                    <button onClick={() => handleJoinFromInvitation(invitation._id, invitation.classCode, userId)}>
                      Join Class
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
export default UserDashboard;