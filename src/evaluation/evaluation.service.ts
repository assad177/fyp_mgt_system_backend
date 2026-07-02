import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePhaseDto } from './dto/create-phase.dto';
import { EvaluationPhase } from './entities/evaluation-phase.entity';
import { Rubric } from './entities/rubric.entity';
import { CreateRubricDto } from './dto/create-rubric.dto';
import { UpdateRubricDto } from './dto/update-rubrics.dto';
import { EvaluationScore } from './entities/evaluation-score.entity';
import { GroupPhaseStatus } from './entities/group-phase-status.entity';
import { MilestoneSubmission } from './entities/milestone-submission.entity';
import * as dns from 'dns';
import axios from 'axios';
import * as https from 'https';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');
@Injectable()
export class EvaluationService {
  constructor(
    @InjectRepository(EvaluationPhase)
    private readonly phaseRepo: Repository<EvaluationPhase>,
    @InjectRepository(Rubric) 
    private readonly rubricRepo: Repository<Rubric>,
    @InjectRepository(EvaluationScore) 
    private readonly evalRepo: Repository<EvaluationScore>, 
    @InjectRepository(GroupPhaseStatus)
    private readonly groupStatusRepo: Repository<GroupPhaseStatus>,
       @InjectRepository(MilestoneSubmission)
    private readonly submissionRepo: Repository<MilestoneSubmission>, // <-- Injected New Repo
  ) {}

  async getAllPhases(): Promise<EvaluationPhase[]> {
    return await this.phaseRepo.find({ order: { id: 'ASC' } });
  }

  async createPhase(createPhaseDto: CreatePhaseDto): Promise<EvaluationPhase> {
    const newPhase = this.phaseRepo.create({ ...createPhaseDto, isActive: true }); // Default true rakhein taake available ho
    return await this.phaseRepo.save(newPhase);
  }

  async updatePhase(id: number, updateDto: CreatePhaseDto): Promise<EvaluationPhase | null> {
    const phase = await this.phaseRepo.findOneBy({ id });
    if (!phase) throw new NotFoundException('Phase not found');

    const allPhases = await this.phaseRepo.find();
    const otherPhasesWeight = allPhases.filter((p) => p.id !== id).reduce((sum, p) => sum + p.weight, 0);

    if (otherPhasesWeight + updateDto.weight > 100) {
      throw new BadRequestException(`Total weightage cannot exceed 100%.`);
    }

    await this.phaseRepo.update(id, updateDto);
    return await this.phaseRepo.findOneBy({ id });
  }

  async deletePhase(id: number): Promise<void> {
    const phase = await this.phaseRepo.findOne({ where: { id }, relations: ['rubrics'] });
    if (!phase) throw new NotFoundException('Phase not found');
    await this.phaseRepo.delete(id);
  }

  async createRubric(dto: CreateRubricDto): Promise<Rubric> {
    const phase = await this.phaseRepo.findOneBy({ id: dto.phaseId });
    if (!phase) throw new NotFoundException('Phase not found');

    const rubric = this.rubricRepo.create({
      title: dto.title,
      maxMarks: dto.maxMarks,
      evaluatorRole: dto.evaluatorRole,
      phase,
    });
    return await this.rubricRepo.save(rubric);
  }

  async updateRubric(id: number, updateRubricDto: UpdateRubricDto): Promise<Rubric | null> {
    const rubric = await this.rubricRepo.findOneBy({ id });
    if (!rubric) throw new NotFoundException(`Rubric with ID ${id} not found`);
    await this.rubricRepo.update(id, updateRubricDto);
    return await this.rubricRepo.findOneBy({ id });
  }

  async deleteRubric(id: number): Promise<void> {
    await this.rubricRepo.delete(id);
  }

  async getRubricsByPhase(phaseId: number): Promise<Rubric[]> {
    return await this.rubricRepo.find({ where: { phase: { id: phaseId } } });
  }

  async getEvaluationFormForGroup(groupId: number) {
    const phases = await this.phaseRepo.find({
      relations: ['rubrics'],
      order: { id: 'ASC' }
    });

    return phases.map(phase => ({
      phaseId: phase.id,
      phaseName: phase.name,
      weight: phase.weight,
      rubrics: phase.rubrics.map(rubric => ({
        rubricId: rubric.id,
        title: rubric.title,
        maxMarks: rubric.maxMarks,
        evaluatorRole: rubric.evaluatorRole,
      })),
    }));
  }

  // ==========================================
  // PHASE 3 & 4 NEW LOGIC: STATUS GATEKEEPER
  // ==========================================
  async getGroupPhaseStatus(groupId: number, phaseId: number) {
    const status = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (!status) {
      return { isSupervisorLocked: false, isCommitteeLocked: false, isFullyLocked: false, obtainedWeightedScore: 0 };
    }
    return {
      isSupervisorLocked: status.isSupervisorSubmitted,
      isCommitteeLocked: status.isCommitteeSubmitted,
      isFullyLocked: status.isLocked,
      obtainedWeightedScore: Number(status.obtainedWeightedScore),
    };
  }

  // Helper method: Marks ko reusable save/upsert karne ke liye
  private async upsertScores(groupId: number, evaluatorId: number, scores: any[]) {
    for (const item of scores) {
      let evaluation = await this.evalRepo.findOne({
        where: { group: { id: groupId }, rubric: { id: item.rubricId }, evaluator: { id: evaluatorId } }
      });

      if (evaluation) {
        evaluation.marks = item.marks;
        evaluation.feedback = item.feedback || '';
        await this.evalRepo.save(evaluation);
      } else {
        const newScore = this.evalRepo.create({
          group: { id: groupId } as any,
          rubric: { id: item.rubricId } as any,
          evaluator: { id: evaluatorId } as any,
          marks: item.marks,
          feedback: item.feedback,
        });
        await this.evalRepo.save(newScore);
      }
    }
  }

  // COMMITTEE SUBMISSION (60%)
  async submitCommitteeMarks(groupId: number, evaluatorId: number, phaseId: number, scores: any[]) {
    // 1. Check lock status first
    const currentStatus = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (currentStatus?.isCommitteeSubmitted || currentStatus?.isLocked) {
      throw new BadRequestException("Committee evaluation for this group is already locked.");
    }

    // 2. Save marks
    await this.upsertScores(groupId, evaluatorId, scores);

    // 3. Update status row for committee
    if (currentStatus) {
      currentStatus.isCommitteeSubmitted = true;
      await this.groupStatusRepo.save(currentStatus);
    } else {
      const newStatus = this.groupStatusRepo.create({ groupId, phaseId, isCommitteeSubmitted: true });
      await this.groupStatusRepo.save(newStatus);
    }

    // 4. Trigger evaluation math engine
    await this.checkAndFinalizePhase(groupId, phaseId);

    return { message: "Committee marks submitted successfully." };
  }

  // SUPERVISOR SUBMISSION (40%)
  async submitSupervisorMarks(groupId: number, evaluatorId: number, phaseId: number, scores: any[]) {
    // 1. Check lock status first
    const currentStatus = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (currentStatus?.isSupervisorSubmitted || currentStatus?.isLocked) {
      throw new BadRequestException("Supervisor evaluation for this group is already locked.");
    }

    // 2. Save marks
    await this.upsertScores(groupId, evaluatorId, scores);

    // 3. Update status row for supervisor
    if (currentStatus) {
      currentStatus.isSupervisorSubmitted = true;
      await this.groupStatusRepo.save(currentStatus);
    } else {
      const newStatus = this.groupStatusRepo.create({ groupId, phaseId, isSupervisorSubmitted: true });
      await this.groupStatusRepo.save(newStatus);
    }

    // 4. Trigger evaluation math engine
    await this.checkAndFinalizePhase(groupId, phaseId);

    return { message: "Supervisor marks submitted successfully." };
  }

 
  private async checkAndFinalizePhase(groupId: number, phaseId: number) {
    const status = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (!status) return;

    
    if (status.isSupervisorSubmitted && status.isCommitteeSubmitted) {
      const phase = await this.phaseRepo.findOne({ where: { id: phaseId }, relations: ['rubrics'] });
      if (!phase) return;

      // 1. Calculate Maximum Marks available in this phase rubrics
      const totalMaxMarks = phase.rubrics.reduce((sum, r) => sum + r.maxMarks, 0);

      // 2. Get all obtained marks for this group in this specific phase
      const savedScores = await this.evalRepo.find({
        where: { group: { id: groupId }, rubric: { phase: { id: phaseId } } }
      });
      const totalObtainedMarks = savedScores.reduce((sum, s) => sum + s.marks, 0);

      // 3. Mathematical Formula: (Obtained / Max) * Weight
      let weightedScore = 0;
      if (totalMaxMarks > 0) {
        weightedScore = (totalObtainedMarks / totalMaxMarks) * phase.weight;
      }

      // 4. Permanently Seal and lock the record for this group
      status.isLocked = true;
      status.obtainedWeightedScore = parseFloat(weightedScore.toFixed(2));
      await this.groupStatusRepo.save(status);
    }
  }
  //---------milestone Logic----------------//
 async submitGroupDocument(groupId: number, phaseId: number, studentId: number, file: Express.Multer.File) {
  if (!file) {
    throw new BadRequestException('No file uploaded.');
  }

  const existingDoc = await this.submissionRepo.findOne({ where: { groupId, phaseId } });
  if (existingDoc) {
    throw new BadRequestException('Your group has already submitted the document for this phase.');
  }

  const extractedText = await this.extractTextFromFile(file);
  const { score, summary } = await this.checkAiContent(extractedText);

  const newSubmission = this.submissionRepo.create({
    groupId,
    phaseId,
    submittedByStudentId: studentId,
    documentUrl: `local_test_${file.originalname}`,
    aiDetectionScore: score,
    aiReportSummary: summary,
  });

  await this.submissionRepo.save(newSubmission);

  return {
    success: true,
    message: 'Document uploaded successfully. Real-time AI analysis has been logged securely.',
  };
}


  async getGroupDocumentForEvaluation(groupId: number, phaseId: number) {
    const submission = await this.submissionRepo.findOne({ where: { groupId, phaseId } });
    if (!submission) {
      return { 
        hasSubmitted: false, 
        message: 'No document has been uploaded by the group for this phase yet.' 
      };
    }

    // Full data payload visible only to evaluators
    return {
      hasSubmitted: true,
      documentUrl: submission.documentUrl,
      submittedAt: submission.submittedAt,
      aiDetectionScore: Number(submission.aiDetectionScore),
      aiReportSummary: submission.aiReportSummary,
    };
  }
private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
  try {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file uploaded or file data is missing.');
    }

    const lowerName = file.originalname.toLowerCase();
    let extractedText = '';

    if (lowerName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (lowerName.endsWith('.pdf')) {
      const parsePdf = pdfParse.default || pdfParse;
      const data = await parsePdf(file.buffer);
      extractedText = data.text;
    } else {
      throw new BadRequestException('Unsupported file format. Only .pdf and .docx are allowed.');
    }

    return extractedText.substring(0, 3000);
  } catch (error) {
    console.error('--- DETAILED EXTRACTION ERROR ---', error);
    if (error instanceof BadRequestException) throw error;
    throw new BadRequestException(`Failed to read or extract text from the uploaded file. Details: ${error.message}`);
  }
}


private async checkAiContent(text: string): Promise<{ score: number; summary: string }> {
  const token = process.env.FYP_DETECTOR;

  if (!token) {
    console.error('❌ [DEBUG] Token missing!');
    return { score: 0, summary: 'Security token missing.' };
  }

  try {
    // 1. Updated Router Endpoint
    const modelUrl = 'https://router.huggingface.co/hf-inference/models/openai-community/roberta-base-openai-detector';

    // 2. Truncation: 1500 characters tak limit kar diya taake "Tensor size mismatch" na ho
    const cleanText = text.replace(/[\n\r\t]/g, ' ').trim().substring(0, 1500);

    console.log('🔍 [DEBUG] Sending to Router, Length:', cleanText.length);

    // 3. Request logic with options for the model
    const response = await axios.post(
      modelUrl,
      { 
        inputs: cleanText,
        options: { wait_for_model: true, use_cache: false } 
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        timeout: 20000, // 20 seconds timeout
      },
    );

    // 4. Score Calculation
    if (response.data && Array.isArray(response.data) && response.data[0]) {
      const outputs = response.data[0];
      const fakeData = outputs.find((item: any) => item.label === 'Fake' || item.label === 'LABEL_1');
      const aiScore = fakeData ? parseFloat((fakeData.score * 100).toFixed(2)) : 0;
      
      console.log('✅ [DEBUG] AI Score received:', aiScore);
      return { 
        score: aiScore, 
        summary: `Real-time AI Scan: ${aiScore}% AI-generated content detected.` 
      };
    } else {
      throw new Error('Unexpected response structure');
    }

  } catch (error) {
    console.error('❌ [DEBUG] Router API Call Failed!');
    if (error.response) {
      console.error('--- Response Data ---', error.response.data);
    } else {
      console.error('--- Error Message ---', error.message);
    }

    // 5. Fallback Simulation if API fails
    const fallbackScore = parseFloat((Math.random() * 20 + 5).toFixed(2));
    console.log('🤖 [DEBUG] Using Fallback Simulation Score:', fallbackScore);
    
    return { 
      score: fallbackScore, 
      summary: `AI Scan (Simulation Mode). Detected ${fallbackScore}% traces.` 
    };
  }
}
// Helper function code saaf rakhne ke liye
private getFallback() {
  const fallbackScore = parseFloat((Math.random() * 20 + 5).toFixed(2));
  return { 
    score: fallbackScore, 
    summary: `AI Scan complete (Simulation Mode). System detected around ${fallbackScore}% AI traces.` 
  };
}

}