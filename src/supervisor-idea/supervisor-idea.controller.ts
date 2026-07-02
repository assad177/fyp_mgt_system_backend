import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { SupervisorIdeaService } from './supervisor-idea.service';
import { CreateProjectIdeaDto } from './dto/create-project-idea.dto';

@Controller('ideas')
export class SupervisorIdeaController {
  constructor(private readonly ideaService: SupervisorIdeaService) {}

  @Post('supervisor/:supervisorId')
  async createIdea(
    @Param('supervisorId') supervisorId: number,
    @Body() createIdeaDto: CreateProjectIdeaDto,
  ) {
    return await this.ideaService.postIdea(supervisorId, createIdeaDto);
  }

  @Get('supervisor/:supervisorId')
  async getSupervisorIdeas(@Param('supervisorId') supervisorId: number) {
    return await this.ideaService.getIdeasBySupervisor(supervisorId);
  }

  @Get('students/available')
  async getAvailableIdeas() {
    return await this.ideaService.getAvailableIdeasForStudents();
  }
}