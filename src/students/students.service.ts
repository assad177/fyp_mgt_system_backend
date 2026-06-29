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

async getMyCommittee(studentId: number) {
  return await this.groupRepo
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


// src/students/students.service.ts (Ya jahan aapka dashboard ka method hai)

async getStudentDashboard(studentId: number) {
  // Step 1: Pehle login student ka apna record database se uthaein
  const student = await this.studentRepo.findOne({
    where: { id: studentId }
  });

  if (!student) {
    throw new NotFoundException('Student record not found.');
  }

  // Step 2: Check karein ke kya is student ki row mein koi proposalId locked hai?
  if (!student.proposalId) {
    // Agar proposalId null hai, toh iska matlab isne abhi koi proposal submit nahi kiya
    return {
      hasProposal: false,
      message: 'Show "Submit Proposal" screen to this student.',
      data: null
    };
  }

  // Step 3: 🔥 FIXING LINE 🔥
  // Ab proposals table se data nikalne ke liye studentId use MAT karein.
  // Balki jo student.proposalId hume upar mili hai, us se project dhoondein!
  const proposal = await this.proposalRepo.findOne({
    where: { id: student.proposalId }, // 👈 Yeh leader aur baqi dono members ke liye true hoga!
    relations: ['student', 'student.user'], // Agar proposal ke sath leader ki details bhi dikhani hon
  });

  return {
    hasProposal: true,
    message: 'Show "Proposal Status/Details" screen to this student.',
    data: proposal
  };
}
}
