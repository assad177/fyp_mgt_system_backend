
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

  @Column()
  groupId: number; 
  
  @ManyToOne(() => Group, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  senderId: number; // User Table  ID (Student or Supervisor)

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