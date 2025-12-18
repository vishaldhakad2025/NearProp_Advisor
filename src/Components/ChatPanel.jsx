import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setActiveRoom,
  setRooms,
  addMessage,
  clearMessages,
  updateTypingStatus,
  updateMessageStatus,
  updateUnreadCount,
} from '../redux/slices/chatSlice';
import { fetchUserProfile } from '../redux/slices/authSlice';
import { initWebSocket, sendMessageToSocket, sendTypingEvent, closeWebSocket } from './websocketService';
import './ChatPanel.css';
import { Link } from 'react-router-dom';
import { FaDotCircle } from 'react-icons/fa';

const BASE_URL = 'https://api.nearprop.com';
const API_PREFIX = 'api';

const ChatPanel = () => {
  const dispatch = useDispatch();
  const { rooms, activeRoom, messages, isConnected, typingUsers } = useSelector((state) => state.chat);
  const { user, loading } = useSelector((state) => state.auth);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [showChatWindow, setShowChatWindow] = useState(false);
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');
  const userId = user && user.id;
  const userName = user && user.name;
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);
  const hasFetchedMessages = useRef(new Set());
  const pendingMessages = useRef(new Set()); // Track pending message IDs

  const currentTypingUsers = typingUsers[activeRoom?.id] || [];
  console.log('Current typing users:', currentTypingUsers);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeRoom]);

  useEffect(() => {
    if (token) {
      dispatch(fetchUserProfile());
      fetchRooms();
    }
  }, [dispatch, token]);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      let endpoint = `${BASE_URL}/${API_PREFIX}/chat/rooms`;
     
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Fetched rooms:--------------------rooms ----', data);

      const formattedRooms = data.map((room) => ({
        id: room.id,
        name: room.buyer?.name || room.title || `Room ${room.id}`,
        avatar: room.buyer?.avatar || room.avatar || '/assets/default-avatar.png',
        propertyId: room.property?.id,
        district: room.property?.district || 'Unknown',
        thumbnail: room.property?.thumbnail || '/assets/default-property.png',
        unreadCount: room.unreadCount || 0,
      }));
      dispatch(setRooms(formattedRooms));

      const lastActiveRoomId = localStorage.getItem('lastActiveRoomId');
      if (lastActiveRoomId) {
        const lastActiveRoom = formattedRooms.find((room) => room.id === parseInt(lastActiveRoomId));
        if (lastActiveRoom) {
          dispatch(setActiveRoom(lastActiveRoom));
          setShowChatWindow(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat rooms:', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (roomId) => {
    if (hasFetchedMessages.current.has(roomId)) {
      console.log(`Messages for room ${roomId} already fetched, skipping.`);
      return;
    }
    try {
      setIsLoading(true);
      dispatch(clearMessages(roomId));
      const response = await fetch(
        `${BASE_URL}/${API_PREFIX}/chat/rooms/${roomId}/messages?includeReplies=true`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      console.log('Fetched messages for room', roomId, ':', data);

      data.forEach((msg) => {
        dispatch(
          addMessage({
            roomId,
            message: {
              ...msg,
              type: msg.mine ? 'outgoing' : 'incoming',
              status: msg.status || 'SENT',
              createdAt: msg.createdAt || new Date().toISOString(),
            },
          })
        );
        if (!msg.mine && msg.status !== 'READ') {
          markMessageAsRead(msg.id, roomId);
        }
      });
      hasFetchedMessages.current.add(roomId);
    } catch (err) {
      console.error('Failed to fetch messages for room', roomId, ':', err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !activeRoom) return;

    const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    if (pendingMessages.current.has(tempId)) {
      console.log('Message already pending:', tempId);
      return;
    }
    pendingMessages.current.add(tempId);

    const createdAt = new Date().toISOString();
    const optimisticMessage = {
      id: tempId,
      content: inputText,
      type: 'outgoing',
      status: 'SENT',
      sender: { id: userId, name: userName || 'Me' },
      createdAt,
    };

    dispatch(addMessage({ roomId: activeRoom.id, message: optimisticMessage }));

    try {
      const response = await fetch(`${BASE_URL}/${API_PREFIX}/chat/rooms/${activeRoom.id}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
          parentMessageId: null,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newMessage = await response.json();

      dispatch(
        updateMessageStatus({
          roomId: activeRoom.id,
          messageId: tempId,
          status: 'SENT',
          updatedMessage: {
            ...newMessage,
            type: 'outgoing',
            status: newMessage.status || 'SENT',
            createdAt: newMessage.createdAt || createdAt,
          },
        })
      );

      // sendMessageToSocket({
      //   destination: `/app/chat/${activeRoom.id}/send`,
      //   body: JSON.stringify({
      //     chatRoomId: activeRoom.id,
      //     sender: { id: userId, name: userName },
      //     content: inputText,
      //     type: 'MESSAGE',
      //     status: 'SENT',
      //     createdAt: newMessage.createdAt || createdAt,
      //   }),
      //   headers: { Authorization: `Bearer ${token}` },
      // });

      setInputText('');
      pendingMessages.current.delete(tempId);
    } catch (err) {
      console.error('Failed to send message:', err.message);
      dispatch(clearMessages(activeRoom.id));
      fetchMessages(activeRoom.id);
      pendingMessages.current.delete(tempId);
    }
  };

  const markMessageAsRead = async (messageId, roomId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/${API_PREFIX}/chat/messages/${messageId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'READ' }),
        }
      );
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      dispatch(
        updateMessageStatus({
          roomId,
          messageId,
          status: 'READ',
        })
      );
      dispatch(updateUnreadCount({ roomId, count: 0 }));
      fetchRooms();
    } catch (err) {
      console.error('Failed to mark message as READ:', err.message);
    }
  };

  useEffect(() => {
    let cleanup = () => {};
    if (token && activeRoom) {
      // Clear hasFetchedMessages for new room to ensure fresh fetch
      hasFetchedMessages.current.delete(activeRoom.id);
      fetchMessages(activeRoom.id);
      cleanup = initWebSocket(token, dispatch, activeRoom.id);
    }
    return () => {
      console.log('Cleaning up WebSocket for room:', activeRoom?.id);
      cleanup();
      closeWebSocket();
    };
  }, [token, activeRoom, dispatch]);

  const handleSend = () => {
    sendMessage();
  };

  const handleTyping = (e) => {
    setInputText(e.target.value);
    if (activeRoom) {
      sendTypingEvent({
        destination: `/app/chat/${activeRoom.id}/typing`,
        body: JSON.stringify({
          type: 'TYPING',
          roomId: activeRoom.id,
          userId,
          userName: userName || `User ${userId}`,
        }),
        headers: { Authorization: `Bearer ${token}` },
      });
      if (typingTimeout) clearTimeout(typingTimeout);
      setTypingTimeout(
        setTimeout(() => {
          sendTypingEvent({
            destination: `/app/chat/${activeRoom.id}/typing`,
            body: JSON.stringify({
              type: 'STOP_TYPING',
              roomId: activeRoom.id,
              userId,
              userName: userName || `User ${userId}`,
            }),
            headers: { Authorization: `Bearer ${token}` },
          });
        }, 2000)
      );
    }
  };

  const handleChatSelect = (chat) => {
    dispatch(setActiveRoom(chat));
    setShowChatWindow(true);
    localStorage.setItem('lastActiveRoomId', chat.id);
  };

  const handleBack = () => {
    setShowChatWindow(false);
    dispatch(setActiveRoom(null));
    localStorage.removeItem('lastActiveRoomId');
  };

  return (
    <div className="chat-app">
      <div className="app-header">
        <h1 className="app-title">NearProp Chat</h1>
        {user && (
          <div className="user-profile">
            <img
              src={user.profileImageUrl || '/assets/default-avatar.png'}
              alt={user.name}
              className="user-avatar"
            />
            <span className="user-name">{user.name || 'User'}</span>
          </div>
        )}
      </div>
      <div className="whatsapp-container">
        {isLoading && <div className="loading">Loading...</div>}
        <div className="sidebar">
          <div className="search-bar">
  <input
    type="text"
    placeholder="Search or start a new chat"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
</div>

<div className="chat-list">
  {rooms.length === 0 && !isLoading ? (
    <div className="no-chats">No chat rooms available</div>
  ) : (
    rooms
      .filter((chat) =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.district.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .map((chat) => (
        <div
          className={`chat-item ${activeRoom?.id === chat.id ? 'active' : ''}`}
          key={chat.id}
          onClick={() => handleChatSelect(chat)}
        >
          <div className="chat-avatar">
            <img
              src={chat.thumbnail}
              alt={chat.name}
              title={`Property in ${chat.district}`}
              className="avatar-img"
            />
          </div>
          <div className="chat-info">
            <div className="chat-name">
              {chat.name}
              <div className="district-name">{chat.district}</div>
            </div>
            <div className="chat-msg">
              {(messages[chat.id]?.slice(-1)[0]?.content) || 'No messages yet'}
            </div>
          </div>
        </div>
      ))
  )}
</div>

        </div>

        <div className={`chat-window ${showChatWindow ? 'active' : ''}`}>
          {activeRoom ? (
            <>
              <div className="chat-header">
                <button className="back-button" onClick={handleBack} aria-label="Back to chat list">
                  ←
                </button>
                <img src={activeRoom?.thumbnail} alt={activeRoom.name} className="avatar-img" />
                <div className="chat-header-info">
                  <span className="chat-profile-name">{activeRoom.name}</span>
                  <span className="chat-district">({activeRoom.district})</span>
                </div>
                 
                <span
                  style={{ marginLeft: 'auto', color: isConnected ? '#22c55e' : '#ef4444', fontSize: '0.8rem' }}
                >
                  <Link to={`/property/${activeRoom.propertyId}`} className="text-sm px-2 flex gap-1 items-center  text-cyan-600 animate-pulse hover:underline">
                    View Property
                    </Link>
                  {isConnected ? <FaDotCircle /> : 'Disconnected'}
                </span>
              </div>

              <div className="chat-messages">
                {messages[activeRoom.id]?.length === 0 && !isLoading ? (
                  <div className="no-messages">No messages in this room</div>
                ) : (
                  messages[activeRoom.id]?.map((msg, idx) => (
                    <div
                      key={msg.id || idx}
                      className={`message ${msg.type} ${msg.status === 'READ' ? 'read' : ''}`}
                      onClick={() => !msg.mine && msg.status !== 'READ' && markMessageAsRead(msg.id, activeRoom.id)}
                    >
                      <div className="message-meta">
                        {msg.sender?.name || 'Unknown'}
                      </div>
                      <div className="message-content">{msg.content}</div>
                      <div className="message-footer">
                        <div className="timestamp">{new Date(msg.createdAt).toLocaleString()}</div>
                        {msg.type === 'outgoing' && (
                          <div className="message-status">{msg.status}</div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
                {currentTypingUsers.length > 0 && (
                  <div className="typing-indicator">
                    {currentTypingUsers.map((user) => user.userName).join(', ')} is typing...
                  </div>
                )}
              </div>

              <div className="chat-input">
                <input
                  type="text"
                  placeholder="Type a message"
                  value={inputText}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button onClick={handleSend} disabled={!isConnected}>
                  Send
                </button>
              </div>
            </>
          ) : (
            <div className="chat-placeholder">Select a chat room</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;