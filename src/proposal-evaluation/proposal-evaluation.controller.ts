import { Controller, Post, Body, Param, Get, Patch } from '@nestjs/common';
import { ProposalEvaluationService } from './proposal-evaluation.service';

@Controller('pec')
export class ProposalEvaluationController {
  constructor(private readonly pecService: ProposalEvaluationService) {}

  // =========================================================================
  // 1. STUDENT ENDPOINT
  // =========================================================================
  @Post('submit-to-pec')
  submit(@Body() body: any) {
    console.log('proposal received');
    return this.pecService.submitToPec(body);
  }

  @Get('check-supervisor/:supervisorId')
checkSupervisor(@Param('supervisorId') supervisorId: number) {
  return this.pecService.checkSupervisorCommittee(supervisorId);
}

  // =========================================================================
  // 2. FYP OFFICE / ADMIN ENDPOINTS
  // =========================================================================
  
  // Committee generate karne ke liye (e.g., /pec/create)
  @Post('create')
  createPec(@Body() body: { name: string; domain: string; supervisorIds?: number[] }) {
    return this.pecService.createPec(body);
  }

  // Committee edit karne aur members add/remove karne ke liye (e.g., /pec/update/3)
  @Patch('update/:id')
  updatePec(
    @Param('id') id: number,
    @Body() body: { name?: string; domain?: string; supervisorIds?: number[] }
  ) {
    return this.pecService.updatePec(id, body);
  }

  // Saari committees ki list dekhne ke liye (e.g., /pec/all)
  @Get('all')
  getAllPecs() {
    return this.pecService.getAllPecs();
  }

  // =========================================================================
  // 3. PEC MEMBER ENDPOINTS
  // =========================================================================

  // FIX: Ab URL mein supervisorId pass hogi (e.g., /pec/submitted/5)
  @Get('submitted/:supervisorId')
  getSubmitted(@Param('supervisorId') supervisorId: number) {
    return this.pecService.getSubmittedProposalsForPec(supervisorId);
  }

  @Patch('approve/:id')
  approve(@Param('id') id: number, @Body('feedback') feedback: string) {
    return this.pecService.approveProposal(id, feedback);
  }

  @Patch('reject/:id')
  reject(@Param('id') id: number, @Body('feedback') feedback: string) {
    return this.pecService.rejectProposal(id, feedback);
  }
}