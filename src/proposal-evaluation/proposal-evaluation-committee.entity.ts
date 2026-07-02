import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity'; // 💡 Apni file structure ke mutabiq path verify karlein

@Entity('proposal_evaluation_committees')
export class ProposalEvaluationCommittee {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100,nullable:true })
  name: string; // e.g., "AI Proposal Evaluation Committee"

  @Column({ type: 'varchar', length: 50 ,nullable:true})
  domain: string; // e.g., "AI", "Web", "Mobile", "Cybersecurity"

  // 🔄 Relationship: Ek PEC mein bohot saare supervisors (members) ho sakte hain
  @OneToMany(() => Supervisor, (supervisor) => supervisor.proposalCommittee)
  supervisors: Supervisor[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updated_at: Date;
}