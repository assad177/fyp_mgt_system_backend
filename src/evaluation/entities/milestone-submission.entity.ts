import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique, CreateDateColumn } from "typeorm";
import { Group } from "src/groups/entities/group.entity";// Apne actual path ke mutabiq handle karein
import { EvaluationPhase } from "./evaluation-phase.entity";

@Entity('milestone_submissions')
@Unique(['groupId', 'phaseId']) // Ek group ek phase mein ek hi document jama kar sakta hai
export class MilestoneSubmission {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupId: number;

  @ManyToOne(() => Group)
  @JoinColumn({ name: 'groupId' })
  group: Group;

  @Column()
  phaseId: number;

  @ManyToOne(() => EvaluationPhase)
  @JoinColumn({ name: 'phaseId' })
  phase: EvaluationPhase;

  @Column({ type: 'text' })
  documentUrl: string; // 2-3 MB file ka uploaded storage link

  @Column()
  submittedByStudentId: number; 

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  aiDetectionScore: number; // AI score (Committee ke liye save hoga)

  @Column({ type: 'text', nullable: true })
  aiReportSummary: string; // Detailed AI analysis text

  @CreateDateColumn()
  submittedAt: Date;
}