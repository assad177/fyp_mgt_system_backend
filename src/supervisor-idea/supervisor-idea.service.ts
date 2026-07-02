import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectIdea } from './entities/projectidea.entity';
import { CreateProjectIdeaDto } from './dto/create-project-idea.dto';

@Injectable()
export class SupervisorIdeaService {
  constructor(
    @InjectRepository(ProjectIdea)
    private projectIdeaRepo: Repository<ProjectIdea>,
  ) {}

  async postIdea(supervisorId: number, dto: CreateProjectIdeaDto) {
    const newIdea = this.projectIdeaRepo.create({
      title: dto.title,
      description: dto.description,
      supervisorId: supervisorId,
      status: 'available',
    });

    return await this.projectIdeaRepo.save(newIdea);
  }

  async getIdeasBySupervisor(supervisorId: number) {
    return await this.projectIdeaRepo.find({
      where: { supervisorId },
      order: { createdAt: 'DESC' },
    });
  }

async getAvailableIdeasForStudents() {
  const ideas = await this.projectIdeaRepo.find({
    where: { status: 'available' },
    order: { createdAt: 'DESC' },
    relations: ['supervisor', 'supervisor.user'],
  });

  return ideas.map(({ supervisor, ...idea }) => ({
    ...idea,
    supervisorName: supervisor?.user?.name ?? null,
  }));
}
}