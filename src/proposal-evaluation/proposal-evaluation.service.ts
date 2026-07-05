import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Proposal } from '../proposal/entities/proposal.entity';
import { ProposalEvaluationCommittee } from './proposal-evaluation-committee.entity';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';
import { Student } from 'src/students/entities/student.entity';
@Injectable()
export class ProposalEvaluationService {
  constructor(
    @InjectRepository(Proposal)
    private readonly proposalRepo: Repository<Proposal>,

    @InjectRepository(ProposalEvaluationCommittee)
    private readonly pecRepo: Repository<ProposalEvaluationCommittee>,

    @InjectRepository(Supervisor)
    private readonly supervisorRepo: Repository<Supervisor>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
  ) {}


async submitToPec(proposalData: {
  title: string;
  description: string;
  domain?: string;
  studentId: number;
  memberRegNos: string[];
  titleEmbedding: number[];
  scopeEmbedding: number[];
  modulesEmbedding: number[];
  highestSimilarity: number;
}) {
  // 1. Submitting student check
  const creator = await this.studentRepo.findOne({ where: { id: proposalData.studentId } });
  if (!creator) {
    throw new NotFoundException('Submitting student record not found.');
  }
  // 2. Fetch all group members
  const allMembers = await this.studentRepo.find({
    where: [
      { id: proposalData.studentId },
      { regNo: In(proposalData.memberRegNos || []) }
    ]
  });
  // 3. Validation: Check if anyone is already locked (BUT allow if previous proposal was rejected)
  for (const member of allMembers) {
    if (member.proposalId) {
      // Check existing proposal status
      const existingProposal = await this.proposalRepo.findOne({ where: { id: member.proposalId } });
      
      // ✨ NAYA LOGIC: Agar existing proposal 'rejected' nahi hai, tabhi block karo
      if (existingProposal && existingProposal.status !== 'rejected') {
        throw new BadRequestException(
          `Student with Reg No '${member.regNo}' already has an active proposal submitted.`
        );
      }
    }
  }
  // 4. Save Proposal (Domain filter bypassed)
  const proposal = this.proposalRepo.create({
    title: proposalData.title,
    description: proposalData.description,
    domain: proposalData.domain || 'General',
    studentId: proposalData.studentId,
    titleEmbedding: proposalData.titleEmbedding,
    scopeEmbedding: proposalData.scopeEmbedding,
    modulesEmbedding: proposalData.modulesEmbedding,
    highestSimilarity: proposalData.highestSimilarity,
    fileUrl: '',
    status: 'submitted', 
    supervisorStatus: 'pending'
  });
  const savedProposal = await this.proposalRepo.save(proposal);
  // 5. Locking Mechanism (Teeno students ko bind karna)
  // Yeh purane rejected proposal ki ID ko over-write kar dega automatically
  const memberIds = allMembers.map((m) => m.id);
  await this.studentRepo.update(
    { id: In(memberIds) },
    { proposalId: savedProposal.id }
  );
  return {
    success: true,
    message: 'Proposal directly submitted to PEC Committee pool!',
    proposalId: savedProposal.id,
  };
}

  async createPec(data: { name: string; domain: string; supervisorIds?: number[] }) {
    // New committee record insert karein
    const committee = this.pecRepo.create({
      name: data.name,
      domain: data.domain,
    });
    const savedPec = await this.pecRepo.save(committee);

    // Agar supervisors select kiye hain, toh unhein bulk mein update karein
    if (data.supervisorIds && data.supervisorIds.length > 0) {
      await this.supervisorRepo.update(
        { id: In(data.supervisorIds) },
        { proposalCommitteeId: savedPec.id }
      );
    }

    return this.pecRepo.findOne({
      where: { id: savedPec.id },
      relations: ['supervisors', 'supervisors.user'],
    });
  }

  async updatePec(id: number, data: { name?: string; domain?: string; supervisorIds?: number[] }) {
    const pec = await this.pecRepo.findOne({ where: { id } });
    if (!pec) throw new NotFoundException('Proposal Evaluation Committee (PEC) not found');

    if (data.name) pec.name = data.name;
    if (data.domain) pec.domain = data.domain;
    await this.pecRepo.save(pec);

    // Bulk members shift/remove logic
    if (data.supervisorIds) {
      // Pehle is committee ke purane saare supervisors ka link khatam (null) karein
      await this.supervisorRepo.update(
        { proposalCommitteeId: id },
        { proposalCommitteeId: null }
      );

      // Phir naye select kiye gae supervisors ko allocate karein
      if (data.supervisorIds.length > 0) {
        await this.supervisorRepo.update(
          { id: In(data.supervisorIds) },
          { proposalCommitteeId: id }
        );
      }
    }

    return this.pecRepo.findOne({
      where: { id },
      relations: ['supervisors', 'supervisors.user'],
    });
  }



// 4. PEC SUPERVISOR: FETCH ALL SUBMITTED PROPOSALS FOR THE COMMITTEE
// =========================================================================
async getSubmittedProposalsForPec(supervisorId: number) {
  const supervisor = await this.supervisorRepo.findOne({
    where: { id: supervisorId },
    relations: ['proposalCommittee'],
  });

  if (!supervisor) throw new NotFoundException('Supervisor not found');
  
 
  if (!supervisor.proposalCommittee) {
    throw new BadRequestException('You are not assigned to the PEC committee yet.');
  }

  // 3. ✨ MAIN UPDATE: Domain filter hata diya, ab saare submitted proposals load honge
  return this.proposalRepo.find({
    where: { 
      status: 'submitted' // 👈 Sirf status check hoga, domain ka koi chakkar nahi
    },
    relations: ['student', 'student.user'],
    order: { createdAt: 'DESC' }, // Naye proposals pehle dikhenge
  });
}

  
  async approveProposal(id: number, feedback?: string) {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    proposal.status = 'approved';
    proposal.pecFeedback = feedback || 'Proposal approved. Proceed further.';

    return this.proposalRepo.save(proposal);
  }

  async rejectProposal(id: number, feedback?: string) {
    const proposal = await this.proposalRepo.findOne({ where: { id } });
    if (!proposal) throw new NotFoundException('Proposal not found');

    proposal.status = 'rejected';
    proposal.pecFeedback = feedback || 'Proposal rejected.';

    return this.proposalRepo.save(proposal);
  }

  // Admin utility function to fetch all PECs
  async getAllPecs() {
    return this.pecRepo.find({
      relations: ['supervisors', 'supervisors.user'],
      order: { createdAt: 'DESC' },
    });
  }

  // src/proposal-evaluation/proposal-evaluation.service.ts ke andar

async checkSupervisorCommittee(supervisorId: number) {
  // Supervisor ko uski committee relation ke sath fetch karein
  const supervisor = await this.supervisorRepo.findOne({
    where: { id: supervisorId },
    relations: ['proposalCommittee'], // Jo relation aapne supervisor entity mein lagayi hai
  });

  if (!supervisor) {
    throw new NotFoundException('Supervisor not found');
  }

  // Agar proposal_committee_id null nahi hai, matlab wo committee mein hai
  if (supervisor.proposalCommitteeId) {
    return {
      inCommittee: true,
      committee: supervisor.proposalCommittee // Committee ka data (id, name, domain)
    };
  }

  // Agar null hai to false bhejien
  return {
    inCommittee: false,
    committee: null
  };
}
}