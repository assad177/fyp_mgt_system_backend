import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('existing_projects')
export class ExistingProject {

  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

 
  @Column('text', { array: true, nullable: true })
  domains: string[];

  @Column({ name: 'file_url', type: 'text', nullable: true })
  fileUrl: string;

  @Column({
    name: 'title_embedding',
    type: 'vector',
    nullable: true,
  })
  titleEmbedding: number[];

  @Column({
    name: 'scope_embedding',
    type: 'vector',
    nullable: true,
  })
  scopeEmbedding: number[];

  @Column({
    name: 'modules_embedding',
    type: 'vector',
    nullable: true,
  })
  modulesEmbedding: number[];
}