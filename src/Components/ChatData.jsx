const chatData = [
  {
    id: 1,
    name: 'Renuka',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    messages: [
      { type: 'incoming', text: 'Hey!' },
      { type: 'outgoing', text: 'Hello Renuka!' },
      { type: 'incoming', text: 'What\'s up?' }
    ]
  },
  {
    id: 2,
    name: 'LN Hospital HR',
    avatar: 'https://randomuser.me/api/portraits/men/2.jpg',
    messages: [
      { type: 'incoming', text: 'Hi, your report is ready.' },
      { type: 'outgoing', text: 'Thanks!' }
    ]
  }
];

export default chatData;
