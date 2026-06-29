// src/chat/chat.controller.ts
import { Controller, Get, Param, Post, Body, ParseIntPipe } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  
  @Get('messages/:groupId')
  async getMessages(@Param('groupId', ParseIntPipe) groupId: number) {
    return await this.chatService.getMessages(groupId);
  }

  @Post('send')
  async sendMessage(@Body() data: { groupId: number; senderId: number; senderName: string; senderRole: string; message: string }) {
    return await this.chatService.saveMessage(data);
  }
}