import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Rubric } from './rubric.entity';

@Entity()
export class EvaluationPhase {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // e.g., "Phase 1: Proposal"
  @Column('float')
  weight: number;

  @Column('timestamp')
  deadline: Date;

  @Column({ default: false })
  isActive: boolean; // FYP Office toggle karega

  @OneToMany(() => Rubric, (rubric) => rubric.phase)
  rubrics: Rubric[];
}