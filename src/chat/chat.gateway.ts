// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`🟢 Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔴 Disconnected: ${client.id}`);
  }

  // 🚪 1. JOIN ROOM LOGIC (Using groupId)
@SubscribeMessage('joinRoom')
handleJoinRoom(@MessageBody() data: any, @ConnectedSocket() client: Socket) {
  // Agar data object hai toh .groupId nikal lo, warna data khud ID hai
  const groupId = (data && typeof data === 'object') ? data.groupId : data;
  
  if (!groupId) {
    console.log("DEBUG - Received raw data, trying to parse:", data);
    return;
  }

  const roomName = `group_${groupId}`;
  client.join(roomName);
  console.log(`👥 Joined: ${roomName}`);
}

  // 💬 2. REAL-TIME SEND MESSAGE LOGIC
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: { groupId: number; senderId: number; senderName: string; senderRole: string; message: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      if (!data?.groupId || !data?.message) {
        console.log("❌ Invalid payload: groupId or message missing");
        return;
      }

      // Exact columns format mapping for modern schema
      const messageData = {
        groupId: Number(data.groupId),
        senderId: data.senderId,
        senderName: data.senderName || "Unknown",
        senderRole: data.senderRole || "student",
        message: data.message,
      };

      // Database mein save karein
      const savedMessage = await this.chatService.saveMessage(messageData);

      // WebSockets room target string setup ("group_15")
      const roomName = `group_${messageData.groupId}`;

      // 🚀 Room mein majood saare users (Teeno dost + Supervisor) ko real-time broadcast karein
      this.server.to(roomName).emit('receiveMessage', savedMessage);

      console.log(`💬 CHAT BROADCASTED TO: ${roomName}`);
      return savedMessage;

    } catch (error) {
      console.log('❌ CHAT ERROR:', error);
      client.emit('error', { message: 'Message could not be broadcasted' });
    }
  }

  private getRoomName(groupId: any): string {
  // Isse hamesha "group_1" ya "group_2" format milega
  return `group_${groupId}`;
}
}