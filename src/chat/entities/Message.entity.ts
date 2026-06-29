// src/chat/entities/message.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm';
import { Group } from 'src/groups/entities/group.entity';

@Entity('messages')
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  // 🛑 Old roomId string replaced with proper Group relation
  @Column()
  groupId: number; 

  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  senderId: number; // User Table ki ID (Student ya Supervisor)

  @Column()
  senderName: string;

  @Column()
  senderRole: string; // 'student' ya 'supervisor'

  @Column('text')
  message: string;

  @Column({ type: 'timestamp', nullable: true })
  seenAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}