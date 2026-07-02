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

  @ManyToOne(() => Rubric)
  rubric: Rubric;

  @ManyToOne(() => Group)
  group: Group;

  @ManyToOne(() => Supervisor)
  evaluator: Supervisor; // Supervisor ya Committee member
}