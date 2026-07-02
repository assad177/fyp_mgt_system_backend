import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';

@Entity('project_ideas')
export class ProjectIdea {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ name: 'supervisor_id' })
  supervisorId: number;

  @ManyToOne(() => Supervisor, { eager: false })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: Supervisor;

  @Column({ length: 50, default: 'available' }) // Status: 'available' ya 'taken'
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}