import { Inject, Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';
@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,
    @InjectRepository(Group) private groupRepo:Repository<Group>,
     @InjectRepository(Proposal) private proposalRepo:Repository<Proposal>
  ) { }

// =========================================================================
// getMyCommittee — Leader AUR Member dono ke liye kaam karta hai
// =========================================================================
async getMyCommittee(studentId: number) {
  // Step 1: Pehle leader ke tor par dhundho
  let groupResult = await this.groupRepo
    .createQueryBuilder('g')
    .leftJoinAndSelect('g.committee', 'c')
    .leftJoinAndSelect('c.members', 'members')
    .leftJoinAndSelect('members.user', 'user')
    .where('g.leadStudentId = :studentId', { studentId })
    .select([
      'g.id',
      'c.id',
      'c.name',
      'members.id',
      'members.designation',
      'user.id',
      'user.name',
      'user.email',
    ])
    .getOne();

  if (groupResult) return groupResult;

  // Step 2: Member student — regNo se dhundho
  const student = await this.studentRepo.findOne({ where: { id: studentId } });
  if (!student || !student.regNo) return null;

  return this.groupRepo
    .createQueryBuilder('g')
    .leftJoinAndSelect('g.committee', 'c')
    .leftJoinAndSelect('c.members', 'members')
    .leftJoinAndSelect('members.user', 'user')
    .where(`g."studentRegs"::jsonb @> :regArr::jsonb`, {
      regArr: JSON.stringify([student.regNo]),
    })
    .select([
      'g.id',
      'c.id',
      'c.name',
      'members.id',
      'members.designation',
      'user.id',
      'user.name',
      'user.email',
    ])
    .getOne();
}
  async findByUserId(userId: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  // students.service.ts
async findByRegNo(regNo: string): Promise<Student | null> {
  return this.studentRepo.findOne({
    where: { regNo },
    relations: ['user'], // User ka data (email/password) fetch karne ke liye
  });
}

  async findById(id: number): Promise<Student | null> {
    return this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
  }

  async create(data: {
    userId: number;
    regNo: string;
    fatherName: string;
    department: string;
  }): Promise<Student> {
    const student = this.studentRepo.create(data);
    return this.studentRepo.save(student);
  }



  async getStudentStatus(regNo: string) {
  const group = await this.groupRepo
    .createQueryBuilder("group")
    .where(":reg = ANY(group.studentRegs)", { reg: regNo })
    .leftJoinAndSelect("group.committee", "committee")
    .getOne();

  if (!group) {
    return {
      inGroup: false,
      canSubmitProposal: true,
      canChat: false,
      groupId: null,
      committee: null,
    };
  }

  return {
    inGroup: true,
    canSubmitProposal: false,
    canChat: true,
    groupId: group.id,
    committee: group.committee,
  };
}


// =========================================================================
// getStudentDashboard — groupId bhi return karta hai (ek hi call mein sab)
// =========================================================================
async getStudentDashboard(studentId: number) {
  // Step 1: Student record fetch karo
  const student = await this.studentRepo.findOne({
    where: { id: studentId }
  });

  if (!student) {
    throw new NotFoundException('Student record not found.');
  }

  // Step 2: Group ID dhundho
  let groupId: number | null = null;
  const leaderGroup = await this.groupRepo.findOne({
    where: { leadStudentId: studentId },
    select: ['id'],
  });
  
  if (leaderGroup) {
    groupId = leaderGroup.id;
  } else if (student.regNo) {
    const memberGroup = await this.groupRepo
      .createQueryBuilder('g')
      .where(`g."studentRegs"::jsonb @> :regArr::jsonb`, {
        regArr: JSON.stringify([student.regNo]),
      })
      .select(['g.id'])
      .getOne();
    if (memberGroup) groupId = memberGroup.id;
  }

  // --- NAYA LOGIC: Supervisor Name Fetch karna ---
  let supervisorName = 'Not Assigned';
  if (groupId) {
    const groupWithSupervisor = await this.groupRepo.findOne({
      where: { id: groupId },
      relations: ['supervisor', 'supervisor.user'], // Relations add kiye
    });
    
    if (groupWithSupervisor?.supervisor?.user?.name) {
      supervisorName = groupWithSupervisor.supervisor.user.name;
    }
  }

  // Step 3: Proposal check
  if (!student.proposalId) {
    return {
      hasProposal: false,
      message: 'Show "Submit Proposal" screen to this student.',
      data: null,
      groupId,
      supervisorName, // Yahan bhi add kar diya
    };
  }

  const proposal = await this.proposalRepo.findOne({
    where: { id: student.proposalId },
    relations: ['student', 'student.user'],
  });

  return {
    hasProposal: true,
    message: 'Show "Proposal Status/Details" screen to this student.',
    data: proposal,
    groupId,
    supervisorName, // Yahan bhi add kar diya
  };
}
}