import { Injectable,NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository,Raw } from 'typeorm';
import { Group } from './entities/group.entity';
import axios from 'axios';
@Injectable()
export class GroupsService {
    @InjectRepository(Group) private  groupRepo:Repository<Group>
    async getGroupsBySupervisor(supervisorId: number) {
    return await this.groupRepo
      .createQueryBuilder('g')
      .leftJoinAndSelect('g.proposal', 'p')
      .where('g.supervisorId = :supervisorId', { supervisorId })
      .select([
        'g.id',
        'g.leadStudentId',
        'p.id',
        'p.title',
        'g.teamMembers',
        'g.createdAt',
      ])
      .getMany();
  
}
    async updateRepo(groupId: number, body: any) {
  const group = await this.groupRepo.findOne({ where: { id: groupId } });

  if (!group) throw new Error("Group not found");

  group.repoUrl = body.repoUrl;
  group.githubUsernames = body.githubUsernames;

  return await this.groupRepo.save(group);
}


async checkPerformance(groupId: number) {
  const group = await this.groupRepo.findOne({ where: { id: groupId } });

  if (!group || !group.repoUrl) {
    throw new Error("Repo missing");
  }


  const parts = group.repoUrl.split("github.com/")[1];
  const [owner, repo] = parts.split("/");

  // fetch commits
  const res = await axios.get(
    `https://api.github.com/repos/${owner}/${repo}/commits`
  );

  const commits = res.data;

  // init count
  const counts: any = {};
  group.githubUsernames.forEach((u) => (counts[u] = 0));

  
  commits.forEach((c) => {
    const user = c.author?.login;
    if (counts[user] !== undefined) {
      counts[user]++;
    }
  });


  group.totalCommits = commits.length;
  group.individualCommits = counts;

  return await this.groupRepo.save(group);
}


async getGroupByStudentId(studentId: string) {
  // studentId abhi bhi string aa rahi hai, humein numeric check ke liye parse karna hoga
  const numericId = parseInt(studentId);

  const group = await this.groupRepo
    .createQueryBuilder('grp')
    .leftJoinAndSelect('grp.proposal', 'proposal')
    // Dono conditions: ya toh leadStudentId match ho, ya JSON array mein regNo ho
    .where('grp.leadStudentId = :numericId OR grp."studentRegs"::jsonb ? :studentId', { 
      numericId, 
      studentId 
    })
    .getOne();

  if (!group) {
    throw new NotFoundException(`Group for student ${studentId} not found`);
  }

  return {
    id: group.id,
    name: `Group ${group.id}`,
    proposal: { 
      title: group.proposal?.title || 'No Title' 
    },
    members: group.teamMembers || []
  };
}
}