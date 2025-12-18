import React from 'react';
import { useParams } from 'react-router-dom';

function UserDetails() {
  const { userId } = useParams();

  // Realistic dummy user data
  const users = {
    1: {
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '123-456-7890',
      address: '123 Elm Street, Springfield, IL',
      profilePic: 'https://randomuser.me/api/portraits/men/1.jpg',
    },
    2: {
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      phone: '987-654-3210',
      address: '456 Oak Avenue, Springfield, IL',
      profilePic: 'https://randomuser.me/api/portraits/women/2.jpg',
    },
    3: {
      name: 'Alice Johnson',
      email: 'alice.johnson@example.com',
      phone: '555-123-4567',
      address: '789 Pine Road, Springfield, IL',
      profilePic: 'https://randomuser.me/api/portraits/women/3.jpg',
    },
  };

  const user = users[userId];

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div className="user-details">
      <h3>User Details</h3>
      <img src={user.profilePic} alt={user.name} className="profile-pic" />
      <p><strong>Name:</strong> {user.name}</p>
      <p><strong>Email:</strong> {user.email}</p>
      <p><strong>Phone:</strong> {user.phone}</p>
      <p><strong>Address:</strong> {user.address}</p>
    </div>
  );
}

export default UserDetails;
