import { Client } from '@stomp/stompjs';

let stompClient = null;
let currentSubscription = null;
let currentRoomId = null;

const subscribeToRoom = (roomId, dispatch) => {
  if (!stompClient || !stompClient.connected || !roomId) {
    console.warn('Cannot subscribe: WebSocket not connected or roomId missing', { roomId });
    return () => {
      console.log('No-op cleanup for failed subscription');
    };
  }

  if (currentSubscription && currentRoomId === roomId) {
    console.log(`Already subscribed to room ${roomId}, skipping.`);
    return () => {
      console.log('No-op cleanup for existing subscription');
    };
  }

  if (currentSubscription) {
    currentSubscription.unsubscribe();
    console.log('Unsubscribed from previous room topic:', currentRoomId);
  }

  currentRoomId = roomId;
  currentSubscription = stompClient.subscribe(`/topic/chat/${roomId}`, (msg) => {
    try {
      const data = JSON.parse(msg.body);
      console.log('WebSocket message received:', data);
      const messageRoomId = data.chatRoomId || data.roomId || roomId;

      switch (data.type) {
        case 'MESSAGE':
          dispatch({
            type: 'chat/addMessage',
            payload: {
              roomId: messageRoomId,
              message: {
                ...data,
                type: data.mine ? 'outgoing' : 'incoming',
                status: data.status || 'SENT',
                createdAt: data.createdAt || new Date().toISOString(),
              },
            },
          });

          if (!data.mine) {
            const messageSound = new Audio('/message-notification.mp3');
            messageSound.play().catch((err) => console.error('Sound play error:', err));
          }
          break;

        case 'TYPING':
        case 'STOP_TYPING':
          dispatch({
            type: 'chat/updateTypingStatus',
            payload: {
              roomId: messageRoomId,
              userId: data.userId,
              userName: data.userName || `User ${data.userId}`,
              isTyping: data.type === 'TYPING',
            },
          });
          break;

        case 'STATUS_UPDATE':
          dispatch({
            type: 'chat/updateMessageStatus',
            payload: { roomId: messageRoomId, messageId: data.messageId, status: data.status },
          });

          if (data.status === 'READ') {
            dispatch({
              type: 'chat/updateUnreadCount',
              payload: { roomId: messageRoomId, count: 0 },
            });
          }
          break;

        default:
          console.warn('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('WebSocket parse error:', error);
    }
  });

  console.log(`Subscribed to /topic/chat/${roomId}`);
  return () => {
    if (currentSubscription && stompClient && stompClient.connected) {
      currentSubscription.unsubscribe();
      console.log(`Unsubscribed from /topic/chat/${roomId}`);
      currentSubscription = null;
      currentRoomId = null;
    }
  };
};

export const initWebSocket = (token, dispatch, roomId) => {
  console.log('initWebSocket called:', { token, roomId });

  if (stompClient && stompClient.connected) {
    console.log('WebSocket already connected, checking subscription');
    return roomId ? subscribeToRoom(roomId, dispatch) : () => {
      console.log('No-op cleanup for existing connection without room');
    };
  }

  stompClient = new Client({
    brokerURL: `wss://api.nearprop.com/api/ws?token=${token}`,
    connectHeaders: {
      Authorization: `Bearer ${token}`,
    },
    debug: (str) => console.log('[STOMP]', str),
    reconnectDelay: 5000,
    onConnect: () => {
      console.log('✅ WebSocket connected');
      dispatch({ type: 'chat/setConnected', payload: true });
      if (roomId) {
        subscribeToRoom(roomId, dispatch);
      }
    },
    onDisconnect: () => {
      console.warn('🔌 WebSocket disconnected');
      dispatch({ type: 'chat/setConnected', payload: false });
      currentSubscription = null;
      currentRoomId = null;
    },
    onStompError: (frame) => {
      console.error('❌ STOMP error:', frame.headers['message']);
    },
    onWebSocketError: (evt) => {
      console.error('❌ WebSocket error:', evt);
    },
  });

  stompClient.activate();
  return () => {
    console.log('Cleaning up WebSocket client');
    if (stompClient && stompClient.connected) {
      if (currentSubscription) {
        currentSubscription.unsubscribe();
        currentSubscription = null;
        currentRoomId = null;
        console.log('🛑 WebSocket subscription closed');
      }
      stompClient.deactivate();
      stompClient = null;
      console.log('🛑 WebSocket closed in initWebSocket cleanup');
    }
  };
};

export const sendMessageToSocket = ({ destination, body, headers }) => {
  if (stompClient && stompClient.connected) {
    console.log('📤 Sending message:', { destination, body });
    stompClient.publish({ destination, body, headers });
  } else {
    console.warn('⚠️ Cannot send message: WebSocket not connected');
  }
};

export const sendTypingEvent = ({ destination, body, headers }) => {
  if (stompClient && stompClient.connected) {
    console.log('✍️ Sending typing event:', { destination, body });
    stompClient.publish({ destination, body, headers });
  } else {
    console.warn('⚠️ Cannot send typing event: WebSocket not connected');
  }
};

export const closeWebSocket = () => {
  if (stompClient) {
    if (currentSubscription) {
      currentSubscription.unsubscribe();
      currentSubscription = null;
      currentRoomId = null;
      console.log('🛑 WebSocket subscription closed');
    }
    stompClient.deactivate();
    stompClient = null;
    console.log('🛑 WebSocket closed');
  }
};