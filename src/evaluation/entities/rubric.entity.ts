import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { EvaluationPhase } from './evaluation-phase.entity';

@Entity()
export class Rubric {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string; // e.g., "AI Detection Score", "Technical Implementation"

  @Column('int')
  maxMarks: number;

  @Column()
  evaluatorRole: 'supervisor' | 'committee'; // Role filter ke liye

  @Column()
  phaseId: number;

  @ManyToOne(() => EvaluationPhase, (phase) => phase.rubrics)
  @JoinColumn({ name: 'phaseId' })
  phase: EvaluationPhase;
}