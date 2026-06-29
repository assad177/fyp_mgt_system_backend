import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn,ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
@Entity('students')
export class Student  {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  userId: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ unique: true })
  regNo: string;

  @Column({ nullable: true })
  department: string;

  @Column({ nullable: true })
  fatherName: string;


  @Column({ name: 'proposal_id', type: 'int', nullable: true })
  proposalId: number | null;

  @ManyToOne(() => Proposal, (proposal) => proposal.students, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'proposal_id' })
  proposal: Proposal;
}