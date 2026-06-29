// committee-assignment.controller.ts
import { Controller, Post, Get,Body } from "@nestjs/common";
import { CommitteeAssignmentService } from "./committee-assignment.service";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository,} from "typeorm";
import { Committee } from "./entities/committee.entity";

@Controller("committee")
export class CommitteeAssignmentController {
  constructor(
    private assignmentService: CommitteeAssignmentService,
    @InjectRepository(Committee) private comRepo: Repository<Committee>,
  ) {}

 
  @Post('create-committees')
  async createCommittees() {
    return await this.assignmentService.createCommitteesOnly();
  }

  @Get('committees-details')
  async getCommitteesDetails() {
    return await this.comRepo.find({
      relations: ['members', 'groups', 'groups.proposal', 'groups.supervisor'],
    });
  }

  @Post('assign-committees')
  async assignCommittees() {
    return await this.assignmentService.assignAndEmail();
  }

  @Post('update-committees')
async updateCommittees(@Body() updateDto: { 
    committeeId: number; 
    name?: string; 
    memberIds?: number[]; 
    groupIds?: number[]; 
}) {
    return await this.assignmentService.updateCommittees(updateDto);
}
}