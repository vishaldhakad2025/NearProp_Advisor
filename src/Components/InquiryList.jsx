import React from 'react';
import './InquiryList.css';

function InquiryList() {
  // Dummy data
  const inquiries = [
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123-456-7890',
      message: 'Interested in the 3BHK apartment in Sector 21.',
      date: '2025-06-03',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '987-654-3210',
      message: 'Please share details about land plots in Gurgaon.',
      date: '2025-06-02',
    },
    {
      id: 3,
      name: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      phone: '999-888-7777',
      message: 'Looking for a villa under 2 Cr in Noida.',
      date: '2025-06-01',
    },
  ];

  return (
    <div className="inquiry-list-container">
      <h2>Inquiry List</h2>
      <table className="inquiry-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Message</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {inquiries.map((inquiry) => (
            <tr key={inquiry.id}>
              <td data-label="#">{inquiry.id}</td>
              <td data-label="Name">{inquiry.name}</td>
              <td data-label="Email">{inquiry.email}</td>
              <td data-label="Phone">{inquiry.phone}</td>
              <td data-label="Message">{inquiry.message}</td>
              <td data-label="Date" className="date-badge">{inquiry.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default InquiryList;
