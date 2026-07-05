import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { ProposalEvaluationCommittee } from 'src/proposal-evaluation/proposal-evaluation-committee.entity';
@Entity('supervisors')
export class Supervisor {
  @PrimaryGeneratedColumn()
  id: number;

  
  @Column({ name: 'user_id',nullable:true })
  userId: number;

  @ManyToOne(() => User, { eager: true, })
  @JoinColumn({ name: 'user_id' })
  user: User;

 
  @Column('text', { array: true, nullable: true })
  expertise: string[];

  @Column({ nullable: true })
  designation: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @Column({ name: 'proposal_committee_id', type: 'int', nullable: true })
  proposalCommitteeId: number | null;

    @ManyToOne(
    () => ProposalEvaluationCommittee, 
    (committee) => committee.supervisors, 
    { nullable: true, onDelete: 'SET NULL' } 
  )
  @JoinColumn({ name: 'proposal_committee_id', },)
  proposalCommittee: ProposalEvaluationCommittee;
}