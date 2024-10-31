import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus,faSignOutAlt, faUsers } from '@fortawesome/free-solid-svg-icons';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [isFormVisible, setFormVisible] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [invitations, setInvitations] = useState([]);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('');
  const [currentGroupId, setCurrentGroupId] = useState(null); 
  const [users, setUsers] = useState([]);

  const location = useLocation();
  const adminName = location.state.name;
  const adminId = location.state.id;
  const navigate = useNavigate();

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/admin/joined-users/${adminId}`);
      console.log(response.data);
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  useEffect(() => {
    if (activeTab === 'home') {
      fetchUsers(); 
    }
  }, []); 

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleLogoClick = () => {
    setActiveTab('home'); 
    setFormVisible(false);
  };

  const handleInvitationClick = (classId) => {
    navigate(`/class/${classId}`);
  };

  const handleInviteClick = () => {
    setFormVisible(true);
    setActiveTab('group-info');
    setActiveTab('form'); 
  };

  const handleCloseForm = () => {
    setActiveTab('home');
    setFormVisible(false);
    setGroupName('');
    setDescription('');
    setInviteSuccessMessage('');
  };
  
  const handleViewInvitationsClick = () => {
    setFormVisible(false);
    setActiveTab('invitations'); 
    fetchInvitations(); 
  };

  const handleCreateGroup = async () => {
    const adminId = location.state.id;
    try {
      const response = await axios.post('http://localhost:5000/api/create-group', {
        groupName,
        description,
        adminId,
      });
      const { inviteLink, inviteCode } = response.data;

      setInviteLink(inviteLink);
      setInviteCode(inviteCode);

      setGroupName('');
      setDescription('');
      setFormVisible(false);
      setActiveTab('group-info');
    } catch (error) {
      console.error('Error creating group:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/get-invitations/${location.state.id}`);
      setInvitations(response.data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    }
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSendInvitation = async (groupId) => {
    setInviteSuccessMessage('');

    if (!inviteEmail) {
      setInviteSuccessMessage('Please enter an email address.');
      return;
    }

    if (!isValidEmail(inviteEmail)) {
      setInviteSuccessMessage('Please enter a valid email address.');
      return;
    }
        try {
            const groupDetails = invitations.find(invitation => invitation._id === groupId);
            if (!groupDetails) {
              console.error('Group details not found');
              return;
            }
            const response = await axios.post('http://localhost:5000/api/invite-user', {
              email: inviteEmail,
              className:groupDetails.groupName,
              description:groupDetails.description,
              classCode: groupDetails.inviteCode,
              invitedById: location.state.id,
            });
      
            setInviteSuccessMessage(response.data.message);
            setInviteEmail('');
            setCurrentGroupId(null);
            setFormVisible(false);
            fetchInvitations();
          } catch (error) {
            console.error('Error sending invitation:', error);
            setInviteSuccessMessage('Failed to send invitation.');
            console.log(inviteSuccessMessage);
          }
  };

  const handleSendButtonClick = (groupId) => {
    setCurrentGroupId(groupId);
    setFormVisible(true);
    setInviteSuccessMessage(''); 
  };

  const handleCloseGroupInfo = () => {
    setInviteLink('');
    setInviteCode('');
    setActiveTab('');
  };

  const handleDeleteGroup = async (groupId) => {
    if (!groupId) {
      console.error('Group ID is undefined');
      return;
    }
    if (window.confirm('Are you sure you want to delete this group?')) {
      try {
        await axios.delete(`http://localhost:5000/api/delete-group/${groupId}`);
        fetchInvitations();
      } catch (error) {
        console.error('Error deleting group:', error);
      }
    }
  };

  return (
    <div className="admin">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark sticky-top">
        <div className="navbar-logo" onClick={handleLogoClick}>
          <img src="/images/logo.png" alt="Logo" />
        </div>
        <div className="container-fluid">
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <button className="nav-link btn" onClick={handleInviteClick} data-title="Create a Group">
                  <FontAwesomeIcon icon={faUserPlus} style={{ fontSize: '25px' }} />
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn" onClick={handleViewInvitationsClick} data-title="View Groups">
                  <FontAwesomeIcon icon={faUsers} style={{ fontSize: '25px' }} />
                </button>
              </li>
              <li className="nav-item">
                <button className="nav-link btn" onClick={handleLogout} data-title="Logout">
                  <FontAwesomeIcon icon={faSignOutAlt} style={{ fontSize: '25px' }}/>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      <div className="admin-dashboard">
        {activeTab === 'home' && (
          <div className="welcome-section">
            <h1>Welcome, {adminName}</h1>
            <h3>Users</h3>
            {users.length === 0 ? (
              <p>No users have joined your classes yet.</p>
            ) : (
              <ul>
                {users.map((user) => (
                  <li key={user._id}>
                    {user.username} - {user.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        {isFormVisible && (
          <div className="form-popup">
            <div className="form-container">
              <h2>{currentGroupId ? 'Send Invitation' : 'Create a Group'}</h2>
              {currentGroupId ? (
                <>
                  {inviteSuccessMessage && (
                    <p className="invite-message">{inviteSuccessMessage}</p>
                  )}
                  <label>
                    Recipient Email:
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                    />
                  </label>
                  <button type="button" onClick={() => handleSendInvitation(currentGroupId)}>
                    Send
                  </button>
                  <button type="button" onClick={() => setFormVisible(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <label>
                    Group Name:
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      required
                    />
                  </label>
                  <br />
                  <label>
                    Group Description (Optional):
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </label>
                  <br />
                  <button type="button" onClick={handleCreateGroup}>
                    Create
                  </button>
                  <button type="button" onClick={handleCloseForm}>
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}
        {activeTab === 'group-info' && inviteLink && (
          <div className="invite-info">
            <h3>Group Created Successfully!</h3>
            <p>
              Invite Link: <a href={inviteLink}>{inviteLink}</a>
            </p>
            <p>
              Invite Code: <strong>{inviteCode}</strong>
            </p>
            <p>Share this link and code via any platform!</p>
            <button onClick={handleCloseGroupInfo}>Close</button>
          </div>
        )}
        {activeTab === 'invitations' && (
          <div className="invitations-list">
            <h3>My Groups  </h3>
            {invitations.length === 0 ? (
              <p>No invitations created yet.</p>
            ) : (
              <ul>
                {invitations.map((invitation) => (
                  <li key={invitation._id}>
                    <div>
                      <strong>Group Name:</strong> {invitation.groupName} 
                      <strong>Description:</strong> {invitation.description}
                    </div>
                    <div>
                      <strong>Invite Code:</strong> {invitation.inviteCode} 
                      <strong>Invite Link:</strong>{' '}
                      <a href={invitation.inviteLink} target="_blank" rel="noopener noreferrer">
                        {invitation.inviteLink}
                      </a>
                    </div>
                    <div>
                      <button onClick={() => handleDeleteGroup(invitation._id)}>Delete</button>
                      <button onClick={() => handleSendButtonClick(invitation._id)}>Invite</button>
                      <button onClick={() => handleInvitationClick(invitation._id)}>View Class</button>
                    </div>
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
export default AdminDashboard;