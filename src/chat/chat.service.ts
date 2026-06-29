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

  // Message save karne ka smart method
  async saveMessage(data: { groupId: number; senderId: number; senderName: string; senderRole: string; message: string }) {
    const message = this.messageRepo.create(data);
    return await this.messageRepo.save(message);
  }

  // 🛑 Old: getMessages(roomId: string) -> ✨ New: getMessages(groupId: number)
  async getMessages(groupId: number) {
    return this.messageRepo.find({
      where: { groupId }, // Ab direct groupId column par fast indexing se search hoga
      order: { createdAt: 'ASC' }, // Taake messages chronological order (line-by-line) mein load hon
    });
  }
}