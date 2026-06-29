import { Injectable ,NotFoundException,BadRequestException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Supervisor } from './entities/supervisor.entity';
import { SupervisorRequest } from './entities/supervison.request.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Student } from 'src/students/entities/student.entity';
@Injectable()
export class SupervisorService {
  constructor(
    @InjectRepository(Supervisor)
    private repo: Repository<Supervisor>,

    @InjectRepository(SupervisorRequest)
    private requestRepo: Repository<SupervisorRequest>,
    @InjectRepository(Student)
    private studentRepo: Repository<Student>,

    @InjectRepository(Group)
    private grouprepo: Repository<Group>,
  ) {}

 
  async create(data: {
    userId: number;
    expertise: string[];
    designation: string;
  }) {
    const supervisor = this.repo.create(data);
    return this.repo.save(supervisor);
  }

   async searchStudents(name?: string) {
    const query = this.studentRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.user', 'u');

    if (name) {
      query.where('u.name ILIKE :name', { name: `%${name}%` });
    }

    return query
      .select(['s.id', 's.regNo', 'u.id', 'u.name'])
      .getMany();
  }

  
async getAllSupervisorsByDomain(domain: string) {
  const query = this.repo
    .createQueryBuilder('s')
    .leftJoinAndSelect('s.user', 'u');

  // 💡 CHECK: Agar domain valid hai, khali string nahi hai, aur 'undefined' nahi hai, sirf tab filter lagayein
  if (domain && domain.trim() !== '' && domain !== 'undefined') {
    query.where(':domain = ANY(s.expertise)', { domain }); // Safe parameterized query
  }

  return query.getMany();
}

 
 async sendSupervisorRequest(body: { studentId: number; supervisorId: number }) {
  const { studentId, supervisorId } = body;

  // 1. Pehle check karein ke request bhejne wala student database mein hai ya nahi
  const leader = await this.studentRepo.findOne({ 
    where: { id: studentId } 
  });
  if (!leader) {
    throw new NotFoundException('Student record not found.');
  }

  // 2. Check karein ke kya is student ka koi proposal submitted/locked hai?
  if (!leader.proposalId) {
    throw new BadRequestException('You cannot send a request without a locked proposal.');
  }

  const proposalId = leader.proposalId;

  // 3. Check karein ke kya is supervisor ko pehle hi request ja chuki hai?
  const exist = await this.requestRepo.findOne({
    where: { proposalId, supervisorId }, // Ab hum direct proposalId se check kar rahe hain
  });

  if (exist) {
    return { success: false, message: 'Request already sent to this supervisor' };
  }

  // 4. ✨ AUTOMATIC FETCH MEMBERS (The Magic) ✨
  // Database se un saare students ko uthao jinka proposalId is leader se match karta hai
  const allMembers = await this.studentRepo.find({
    where: { proposalId: proposalId },
    relations: ['user'] // user relation load karein taake naam (name) bhi mil jaye
  });

  // teamMembers ka array automatic taiyar karein jaisa aapke acceptRequest ko chahiye
  const teamMembers = allMembers.map((member) => ({
    id: member.id,
    regNo: member.regNo,
    name: member.user?.name || 'Group Member',
  }));

  // 5. Request create aur save karein
  const request = this.requestRepo.create({
    studentId: leader.id, // Leader/Sender ID
    proposalId,
    supervisorId,
    teamMembers, // Auto-populated data array
    status: 'pending',
  });

  await this.requestRepo.save(request);
  
  return { 
    success: true, 
    message: 'Supervisor request sent successfully with all group members!' 
  }
 }

 
  async getRequests(supervisorId: number) {
    return this.requestRepo.find({
      where: { supervisorId },
    });
  }

 
 async acceptRequest(requestId: number) {
  const request = await this.requestRepo.findOne({
    where: { id: requestId },
  });

  if (!request) throw new Error('Request not found');

  request.status = 'accepted';
  await this.requestRepo.save(request);

 
  const studentRegs: string[] =
    request.teamMembers
      ?.map((m) => m.regNo)
      .filter((regNo): regNo is string => !!regNo) || [];

  
  const group = await this.grouprepo.save({
    proposalId: request.proposalId,
    supervisorId: request.supervisorId,
    leadStudentId: request.studentId,
     teamMembers: request.teamMembers,
    studentRegs: studentRegs,

    committeeId: null,

   
    repoUrl: null,
    githubUsernames: [],
    totalCommits: 0,
    individualCommits: {},
  });

  return {
    message: 'Request accepted, group created successfully',
    group,
  };
}
findByUserId(userId: number) {
  return this.repo.findOne({
    where: { userId },
  });
}
}
