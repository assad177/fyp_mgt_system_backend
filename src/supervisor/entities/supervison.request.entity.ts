import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Student } from '../../students/entities/student.entity';
import { Supervisor } from '../../supervisor/entities/supervisor.entity';
import { Proposal } from '../../proposal/entities/proposal.entity';

@Entity('supervisor_requests')
export class SupervisorRequest {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Student, { eager: true })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Column({ name: 'student_id' })
  studentId: number;

  @ManyToOne(() => Proposal, { eager: true })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;

  @Column({ name: 'proposal_id' })
  proposalId: number;

 
  @ManyToOne(() => Supervisor, { eager: true })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Supervisor;

  @Column({ name: 'supervisor_id' })
  supervisorId: number;


  @Column('json', { nullable: true })
  teamMembers: {
    name: string;
    regNo?: string;
  }[];


  @Column({ default: 'pending' })
  status: 'pending' | 'accepted' | 'rejected';

  
  @CreateDateColumn()
  createdAt: Date;
}