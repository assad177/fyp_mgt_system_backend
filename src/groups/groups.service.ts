import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Group } from './entities/group.entity';
import { Committee } from 'src/committee-assignment/entities/committee.entity';
import { Student } from 'src/students/entities/student.entity';
import axios from 'axios';
@Injectable()
export class GroupsService {
  @InjectRepository(Group) private groupRepo: Repository<Group>
  @InjectRepository(Committee) private committeeRepo: Repository<Group>
  @InjectRepository(Student) private studentRepo: Repository<Student>

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

    const res = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/commits`
    );

    const commits = res.data;
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
    const numericId = parseInt(studentId);
    let group = await this.groupRepo
      .createQueryBuilder('grp')
      .leftJoinAndSelect('grp.proposal', 'proposal')
      .where('grp.leadStudentId = :numericId', { numericId })
      .getOne();


    if (!group) {
      const student = await this.studentRepo.findOne({ where: { id: numericId } });
      if (student && student.regNo) {
        group = await this.groupRepo
          .createQueryBuilder('grp')
          .leftJoinAndSelect('grp.proposal', 'proposal')
          .where(`grp."studentRegs"::jsonb @> :regArr::jsonb`, {
            regArr: JSON.stringify([student.regNo]),
          })
          .getOne();
      }
    }

    if (!group) {
      throw new NotFoundException(`Group for student ${studentId} not found`);
    }

    return {
      id: group.id,
      name: `Group ${group.id}`,
      leadStudentId: group.leadStudentId,
      supervisorId: group.supervisorId,
      proposal: {
        title: group.proposal?.title || 'No Title'
      },
      members: group.teamMembers || [],
      studentRegs: group.studentRegs || [],
    };
  }

  async getGroupsForSupervisor(supervisorId: number): Promise<Group[]> {
    const committees = await this.committeeRepo
      .createQueryBuilder("committee")
      .innerJoin("committee_members", "cm", "cm.committee_id = committee.id")
      .where("cm.supervisor_id = :id", { id: supervisorId })
      .getMany();

    if (committees.length === 0) return [];

    const committeeIds = committees.map(c => c.id);

    return await this.groupRepo.find({
      where: {
        committeeId: In(committeeIds)
      },
      relations: ['proposal', 'supervisor', 'committee'],
    });
  }

  async getRepoUrl(groupId: number): Promise<{ repoUrl: string | null }> {
    const group = await this.groupRepo.findOne({
      where: { id: groupId },
      select: ['repoUrl'],
    });
    if (!group) {
      throw new NotFoundException(`Group with ID ${groupId} not found`);
    }

    return { repoUrl: group.repoUrl };
  }

}