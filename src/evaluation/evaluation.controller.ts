import { Controller, Post, Body, Param, Delete, Patch, Get, ParseIntPipe,UploadedFile, } from '@nestjs/common';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { EvaluationService } from './evaluation.service';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubrics.dto';
import { UseInterceptors, } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('evaluation')
export class EvaluationController {
  constructor(private readonly evaluationService: EvaluationService) {}

  @Get('phases')
  async findAll() {
    return await this.evaluationService.getAllPhases();
  }

  @Post('/phases')
  async create(@Body() createPhaseDto: CreatePhaseDto) {
    return await this.evaluationService.createPhase(createPhaseDto);
  }

  @Patch(':id')
  async update(@Param('id') id: number, @Body() updateDto: CreatePhaseDto) {
    return await this.evaluationService.updatePhase(Number(id), updateDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: number) {
    return await this.evaluationService.deletePhase(Number(id));
  }

  // Rubrics routes
  @Post('rubrics')
  async createRubric(@Body() createRubricDto: CreateRubricDto) {
    return await this.evaluationService.createRubric(createRubricDto);
  }

  @Patch('rubrics/:id')
  async updateRubric(@Param('id') id: number, @Body() updateRubricDto: UpdateRubricDto) {
    return await this.evaluationService.updateRubric(id, updateRubricDto);
  }

  @Delete('rubrics/:id')
  async removeRubric(@Param('id') id: number) {
    return await this.evaluationService.deleteRubric(id);
  }

  @Get('rubrics/:phaseId')
  async findRubricsByPhase(@Param('phaseId') phaseId: number) {
    return await this.evaluationService.getRubricsByPhase(phaseId);
  }

  @Get('evaluation-form/:groupId')
  async getEvaluationForm(@Param('groupId') groupId: number) {
    return await this.evaluationService.getEvaluationFormForGroup(Number(groupId));
  }

  // ==========================================
  // PHASE 3 & 4 ENDPOINTS
  // ==========================================

  // Step 12: GET current locking status for a specific group & phase
  @Get('status/:groupId/:phaseId')
  async getStatus(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number
  ) {
    return await this.evaluationService.getGroupPhaseStatus(groupId, phaseId);
  }

  // Committee submission endpoint
  @Post('submit/committee/:groupId/:evaluatorId/:phaseId')
  async submitCommitteeMarks(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('evaluatorId', ParseIntPipe) evaluatorId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() body: { scores: { rubricId: number; marks: number; feedback?: string }[] }
  ) {
    return await this.evaluationService.submitCommitteeMarks(groupId, evaluatorId, phaseId, body.scores);
  }

  // Supervisor submission endpoint
  @Post('submit/supervisor/:groupId/:evaluatorId/:phaseId')
  async submitSupervisorMarks(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('evaluatorId', ParseIntPipe) evaluatorId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
    @Body() body: { scores: { rubricId: number; marks: number; feedback?: string }[] }
  ) {
    return await this.evaluationService.submitSupervisorMarks(groupId, evaluatorId, phaseId, body.scores);
  }





  //----------------------------//
@Post('submit-document/:groupId/:phaseId/:studentId')
@UseInterceptors(FileInterceptor('file'))
async uploadDocument(
  @Param('groupId') groupId: number,
  @Param('phaseId') phaseId: number,
  @Param('studentId') studentId: number,
  @UploadedFile() file: Express.Multer.File,
) {
  // fileUrl ki jagah 'file' pass karein:
  return await this.evaluationService.submitGroupDocument(groupId, phaseId, studentId, file);
}

  /**
   * Endpoint for Committee and Supervisors to see the document and AI report during grading
   * GET /evaluation/view-document/:groupId/:phaseId
   */
  @Get('view-document/:groupId/:phaseId')
  async viewDocumentForEvaluation(
    @Param('groupId', ParseIntPipe) groupId: number,
    @Param('phaseId', ParseIntPipe) phaseId: number,
  ) {
    return await this.evaluationService.getGroupDocumentForEvaluation(groupId, phaseId);
  }
}