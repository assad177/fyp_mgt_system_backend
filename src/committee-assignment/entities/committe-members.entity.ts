import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from "typeorm";
import { Committee } from "./committee.entity";
import { Supervisor } from "src/supervisor/entities/supervisor.entity";

@Entity("committee_members") 
export class CommitteeMember {

  @PrimaryColumn()
  committee_id: number;

  @PrimaryColumn()
  supervisor_id: number;

  @ManyToOne(() => Committee, committee => committee.members)
  @JoinColumn({ name: "committee_id" })
  committee: Committee;

  @ManyToOne(() => Supervisor)
  @JoinColumn({ name: "supervisor_id" })
  supervisor: Supervisor;
}