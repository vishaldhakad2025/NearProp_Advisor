import { createSlice } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';
const token = localStorage.getItem('token');

export const fetchChatRooms = () => async (dispatch) => {
  try {
    const response = await axiosInstance.get(`/api/chat/rooms`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    console.log('fetchChatRooms response:', response.data);
    dispatch(setRooms(response.data || []));
  } catch (err) {
    console.error('Failed to fetch chat rooms:', err);
  }
};

export const selectRoomByPropertyId = (state, propertyId) =>
  state.chat.rooms.find((room) => room.propertyId === propertyId);

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    rooms: [],
    activeRoom: null,
    messages: {},
    isConnected: false,
    typingUsers: {},
  },
  reducers: {
    setRooms: (state, action) => {
      state.rooms = action.payload;
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },
    addMessage: (state, action) => {
      const { roomId, message } = action.payload;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      // Stricter duplicate check
      if (!state.messages[roomId].some(
        (m) => m.id === message.id || 
              (m.content === message.content && 
               m.createdAt === message.createdAt && 
               m.sender?.id === message.sender?.id)
      )) {
        console.log('Adding message to room', roomId, ':', message);
        state.messages[roomId].push(message);
      } else {
        console.log('Duplicate message detected, skipping:', message);
      }
    },
    clearMessages: (state, action) => {
      const roomId = action.payload;
      state.messages[roomId] = [];
    },
    setConnected: (state, action) => {
      state.isConnected = action.payload;
    },
    updateTypingStatus: (state, action) => {
      const { roomId, userId, userName, isTyping } = action.payload;
      console.log('Updating typing status:', { roomId, userId, userName, isTyping });
      if (!state.typingUsers[roomId]) state.typingUsers[roomId] = [];
      if (isTyping) {
        if (!state.typingUsers[roomId].some((user) => user.userId === userId)) {
          state.typingUsers[roomId].push({ userId, userName });
        }
      } else {
        state.typingUsers[roomId] = state.typingUsers[roomId].filter((user) => user.userId !== userId);
      }
    },
    updateMessageStatus: (state, action) => {
      const { roomId, messageId, status, updatedMessage } = action.payload;
      if (state.messages[roomId]) {
        const index = state.messages[roomId].findIndex((msg) => msg.id === messageId);
        if (index !== -1 && updatedMessage) {
          state.messages[roomId][index] = updatedMessage;
        } else if (index !== -1) {
          state.messages[roomId][index].status = status;
        }
      }
    },
    updateUnreadCount: (state, action) => {
      const { roomId, count } = action.payload;
      const room = state.rooms.find((r) => r.id === roomId);
      if (room) room.unreadCount = count;
    },
  },
});

export const {
  setRooms,
  setActiveRoom,
  addMessage,
  clearMessages,
  setConnected,
  updateTypingStatus,
  updateMessageStatus,
  updateUnreadCount,
} = chatSlice.actions;
export default chatSlice.reducer;