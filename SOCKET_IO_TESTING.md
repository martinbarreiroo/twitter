# Testing Socket.IO Chat System

## Important: Socket.IO vs WebSocket

**DO NOT** try to test Socket.IO with WebSocket clients!

- **Socket.IO** is a library that can use WebSockets but adds its own protocol layer
- **WebSocket** is the raw protocol
- Our chat system uses **Socket.IO**, not raw WebSockets
- You must use Socket.IO-compatible clients for testing

## Prerequisites

1. Server is running on `http://localhost:8080`
2. You have two users that mutually follow each other
3. You have JWT tokens for both users

## Testing Methods

### Option 1: HTML Test Client (Recommended)

Use the provided `chat-test.html` file - it's specifically designed for Socket.IO testing.

### Option 2: Postman (Socket.IO Support Required)

Only if your Postman version supports Socket.IO requests.

### Option 3: Command Line with socket.io-client

```bash
npm install -g socket.io-client
```

## Step-by-Step Guide

### 1. Setup Users and Authentication (HTTP)

First, use the regular HTTP requests in the Postman collection:

1. **Login User 1** - Get JWT token
2. **Login User 2** - Get JWT token
3. **User 1 follows User 2**
4. **User 2 follows User 1**

Make sure to save the tokens and user IDs in Postman variables.

### 2. Socket.IO Connection Testing

#### A. Using HTML Test Client (chat-test.html)

1. Open `chat-test.html` in a browser
2. Enter your JWT token
3. Click "Connect"
4. Start testing real-time features

#### B. Using Postman (if Socket.IO supported)

1. In Postman, click **New** → **Socket.IO** (NOT WebSocket!)
2. Set URL: `http://localhost:8080` (NOT ws://)
3. In the **Connect** section, set authentication:

```json
{
  "auth": {
    "token": "YOUR_JWT_TOKEN_HERE"
  }
}
```

#### Alternative Authentication Methods

- **Query Parameter**: `http://localhost:8080?token=YOUR_JWT_TOKEN`
- **Header**: Add `Authorization: Bearer YOUR_JWT_TOKEN` in headers

### 3. Socket.IO Event Testing

Once connected, you can send these Socket.IO events:

#### Send Message

**Event Name:** `sendMessage`
**Event Data:**

```json
{
  "receiverId": "USER_ID_HERE",
  "content": "Hello from Postman!"
}
```

#### Mark Messages as Read

**Event Name:** `markAsRead`
**Event Data:**

```json
{
  "conversationPartnerId": "USER_ID_HERE"
}
```

#### Typing Indicator

**Event Name:** `typing`
**Event Data:**

```json
{
  "receiverId": "USER_ID_HERE",
  "isTyping": true
}
```

### 4. Listening for Events

Set up listeners for these events in Postman:

#### Message Received

**Event Name:** `messageReceived`
**Expected Data:**

```json
{
  "id": "message-id",
  "content": "Hello from Postman!",
  "senderId": "sender-id",
  "receiverId": "receiver-id",
  "isRead": false,
  "createdAt": "2025-05-30T...",
  "updatedAt": "2025-05-30T..."
}
```

#### Messages Marked as Read

**Event Name:** `messagesMarkedAsRead`
**Expected Data:**

```json
{
  "userId": "user-id",
  "conversationPartnerId": "partner-id"
}
```

#### User Typing

**Event Name:** `userTyping`
**Expected Data:**

```json
{
  "userId": "user-id",
  "isTyping": true
}
```

## Testing Workflow

1. **Create two Socket.IO connections** in Postman (one for each user)
2. **Connect both clients** with different JWT tokens
3. **Send a message** from User 1 to User 2
4. **Verify** User 2 receives the `messageReceived` event
5. **Mark messages as read** from User 2
6. **Verify** User 1 receives the `messagesMarkedAsRead` event
7. **Test typing indicators** between users

## Key Differences: Socket.IO vs WebSocket

### Socket.IO Features

- ✅ Automatic reconnection
- ✅ Room/namespace support
- ✅ Event-based communication
- ✅ Fallback to polling if WebSocket fails
- ✅ Built-in acknowledgments

### Protocol Differences

- **Socket.IO URL**: `http://localhost:8080`
- **WebSocket URL**: `ws://localhost:8080`
- **Socket.IO Events**: Named events with JSON data
- **WebSocket**: Raw message strings

## Troubleshooting

### Connection Issues

- ✅ Use `http://` not `ws://` for Socket.IO
- ✅ Ensure JWT token is valid and not expired
- ✅ Check that users mutually follow each other
- ✅ Verify server is running on the correct port

### Authentication Errors

- ✅ Token should be passed in auth object: `{"auth": {"token": "..."}}`
- ✅ Alternative: pass as query parameter
- ✅ Don't include "Bearer " prefix in Socket.IO auth
- ✅ Verify token format and user permissions

### Event Issues

- ✅ Event names are case-sensitive
- ✅ Ensure JSON data format is correct
- ✅ Check mutual follow relationship exists
- ✅ Verify receiver user ID is valid

## Advanced Testing

### Test Error Cases

1. Send messages between non-mutual followers
2. Use invalid/expired JWT tokens
3. Send malformed event data
4. Test connection without authentication

### Performance Testing

1. Send rapid successive messages
2. Test with long message content (up to 500 chars)
3. Test multiple concurrent connections
4. Test reconnection scenarios
