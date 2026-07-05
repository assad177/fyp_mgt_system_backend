import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Rubric } from './rubric.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';

@Entity()
export class EvaluationScore {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('float')
  marks: number;

  @Column({ type: 'text', nullable: true })
  feedback: string;

  // 👇 --- SNAPSHOT COLUMNS (For Data Freeze) --- 👇
  @Column({ type: 'varchar', nullable: true })
  rubricTitleSnapshot: string;

  @Column({ type: 'int', nullable: true })
  rubricMaxMarksSnapshot: number;

  @Column({ type: 'varchar', nullable: true })
  phaseNameSnapshot: string;

  @Column({ type: 'float', nullable: true })
  phaseWeightSnapshot: number;
  // 👆 ------------------------------------------- 👆

  @ManyToOne(() => Rubric)
  rubric: Rubric;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => Supervisor)
  evaluator: Supervisor; // Supervisor ya Committee member
}