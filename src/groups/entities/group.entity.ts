import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Committee } from "src/committee-assignment/entities/committee.entity";
import { Proposal } from "src/proposal/entities/proposal.entity";
import { Supervisor } from "src/supervisor/entities/supervisor.entity";

@Entity('groups')
export class Group {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  proposalId: number;

  @ManyToOne(() => Proposal)
  @JoinColumn({ name: 'proposalId' })
  proposal: Proposal;

  @Column()
  supervisorId: number;

  @ManyToOne(() => Supervisor)
  @JoinColumn({ name: 'supervisorId' })
  supervisor: Supervisor;

  @Column()
  leadStudentId: number;

  @Column('json', { nullable: true })
  teamMembers: Array<{ name: string; regNo?: string }>;

  @Column('json', { nullable: true })
  studentRegs: string[];

  @Column({ nullable: true, type: 'int' })
  committeeId: number | null;

  @ManyToOne(() => Committee, committee => committee.groups, { nullable: true })
  @JoinColumn({ name: 'committeeId' })
  committee: Committee;

  @Column({ type: 'text', nullable: true })
  repoUrl: string | null;

  @Column('json', { nullable: true })
  githubUsernames: string[];

  @Column({ default: 0 })
  totalCommits: number;

  @Column('json', { nullable: true })
  individualCommits: Record<string, number>;

  @CreateDateColumn()
  createdAt: Date;
}