import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, Unique } from "typeorm";
import { Group } from "src/groups/entities/group.entity";// Apne path ke mutabiq adjust karein
import { EvaluationPhase } from "./evaluation-phase.entity"; 

@Entity('group_phase_status')
@Unique(['groupId', 'phaseId']) // Ek group ka ek phase mein ek hi status record hoga
export class GroupPhaseStatus {

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

  @Column({ default: false })
  isSupervisorSubmitted: boolean;

  @Column({ default: false })
  isCommitteeSubmitted: boolean;

  @Column({ default: false })
  isLocked: boolean;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0.00 })
  obtainedWeightedScore: number;
}