// src/chat/chat.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/Message.entity'; // 💡 Ensure karein entity ka path sahi ho

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Message)
    private messageRepo: Repository<Message>,
  ) {}


  async saveMessage(data: { groupId: number; senderId: number; senderName: string; senderRole: string; message: string }) {
    const message = this.messageRepo.create(data);
    return await this.messageRepo.save(message);
  }

  
  async getMessages(groupId: number) {
    return this.messageRepo.find({
      where: { groupId }, 
      order: { createdAt: 'ASC' }, // Taake messages chronological order (line-by-line) mein load hon
    });
  }
}