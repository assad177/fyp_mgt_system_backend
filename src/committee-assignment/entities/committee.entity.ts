import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, OneToMany } from "typeorm";
import { Supervisor } from "src/supervisor/entities/supervisor.entity";
import { Group } from "src/groups/entities/group.entity";

@Entity("committees")
export class Committee {

  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @ManyToMany(() => Supervisor, { eager: true })
  @JoinTable({
    name: "committee_members",
    joinColumn: { name: "committee_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "supervisor_id", referencedColumnName: "id" },
  })
  members: Supervisor[];

  @OneToMany(() => Group, group => group.committee)
  groups: Group[];

 

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}