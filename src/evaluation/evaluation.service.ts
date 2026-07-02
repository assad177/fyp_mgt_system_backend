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

import axios from 'axios';
import * as mammoth from 'mammoth';
const pdfParse = require('pdf-parse');

type EvaluatorRole = 'supervisor' | 'committee';

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
    private readonly submissionRepo: Repository<MilestoneSubmission>,
  ) {}

  async getAllPhases(): Promise<EvaluationPhase[]> {
    return this.phaseRepo.find({ order: { id: 'ASC' } });
  }

  async createPhase(createPhaseDto: CreatePhaseDto): Promise<EvaluationPhase> {
    const newPhase = this.phaseRepo.create({ ...createPhaseDto, isActive: true });
    return this.phaseRepo.save(newPhase);
  }

  async updatePhase(id: number, updateDto: CreatePhaseDto): Promise<EvaluationPhase | null> {
    const phase = await this.phaseRepo.findOneBy({ id });
    if (!phase) throw new NotFoundException('Phase not found');

    const allPhases = await this.phaseRepo.find();
    const otherPhasesWeight = allPhases
      .filter((p) => p.id !== id)
      .reduce((sum, p) => sum + p.weight, 0);

    if (otherPhasesWeight + updateDto.weight > 100) {
      throw new BadRequestException('Total weightage cannot exceed 100%.');
    }

    await this.phaseRepo.update(id, updateDto);
    return this.phaseRepo.findOneBy({ id });
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
    return this.rubricRepo.save(rubric);
  }

  async updateRubric(id: number, updateRubricDto: UpdateRubricDto): Promise<Rubric | null> {
    const rubric = await this.rubricRepo.findOneBy({ id });
    if (!rubric) throw new NotFoundException(`Rubric with ID ${id} not found`);
    await this.rubricRepo.update(id, updateRubricDto);
    return this.rubricRepo.findOneBy({ id });
  }

  async deleteRubric(id: number): Promise<void> {
    await this.rubricRepo.delete(id);
  }

  async getRubricsByPhase(phaseId: number): Promise<Rubric[]> {
    return this.rubricRepo.find({ where: { phase: { id: phaseId } } });
  }

  async getEvaluationFormForGroup(groupId: number) {
    const phases = await this.phaseRepo.find({
      relations: ['rubrics'],
      order: { id: 'ASC' },
    });

    return phases.map((phase) => ({
      phaseId: phase.id,
      phaseName: phase.name,
      weight: phase.weight,
      rubrics: phase.rubrics.map((rubric) => ({
        rubricId: rubric.id,
        title: rubric.title,
        maxMarks: rubric.maxMarks,
        evaluatorRole: rubric.evaluatorRole,
      })),
    }));
  }

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

  private async upsertScores(groupId: number, evaluatorId: number, scores: any[]) {
    for (const item of scores) {
      const existing = await this.evalRepo.findOne({
        where: { group: { id: groupId }, rubric: { id: item.rubricId }, evaluator: { id: evaluatorId } },
      });

      if (existing) {
        existing.marks = item.marks;
        existing.feedback = item.feedback || '';
        await this.evalRepo.save(existing);
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

  private async submitMarks(role: EvaluatorRole, groupId: number, evaluatorId: number, phaseId: number, scores: any[]) {
    const lockField = role === 'committee' ? 'isCommitteeSubmitted' : 'isSupervisorSubmitted';
    const roleLabel = role === 'committee' ? 'Committee' : 'Supervisor';

    const currentStatus = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (currentStatus?.[lockField] || currentStatus?.isLocked) {
      throw new BadRequestException(`${roleLabel} evaluation for this group is already locked.`);
    }

    await this.upsertScores(groupId, evaluatorId, scores);

    if (currentStatus) {
      currentStatus[lockField] = true;
      await this.groupStatusRepo.save(currentStatus);
    } else {
      const newStatus = this.groupStatusRepo.create({ groupId, phaseId, [lockField]: true });
      await this.groupStatusRepo.save(newStatus);
    }

    await this.checkAndFinalizePhase(groupId, phaseId);

    return { message: `${roleLabel} marks submitted successfully.` };
  }

  async submitCommitteeMarks(groupId: number, evaluatorId: number, phaseId: number, scores: any[]) {
    return this.submitMarks('committee', groupId, evaluatorId, phaseId, scores);
  }

  async submitSupervisorMarks(groupId: number, evaluatorId: number, phaseId: number, scores: any[]) {
    return this.submitMarks('supervisor', groupId, evaluatorId, phaseId, scores);
  }

  private async checkAndFinalizePhase(groupId: number, phaseId: number) {
    const status = await this.groupStatusRepo.findOne({ where: { groupId, phaseId } });
    if (!status) return;

    if (!(status.isSupervisorSubmitted && status.isCommitteeSubmitted)) return;

    const phase = await this.phaseRepo.findOne({ where: { id: phaseId }, relations: ['rubrics'] });
    if (!phase) return;

    const totalMaxMarks = phase.rubrics.reduce((sum, r) => sum + r.maxMarks, 0);

    const savedScores = await this.evalRepo.find({
      where: { group: { id: groupId }, rubric: { phase: { id: phaseId } } },
    });
    const totalObtainedMarks = savedScores.reduce((sum, s) => sum + s.marks, 0);

    const weightedScore = totalMaxMarks > 0 ? (totalObtainedMarks / totalMaxMarks) * phase.weight : 0;

    status.isLocked = true;
    status.obtainedWeightedScore = parseFloat(weightedScore.toFixed(2));
    await this.groupStatusRepo.save(status);
  }

async submitGroupDocument(
  groupId: number,
  phaseId: number,
  studentId: number,
  githubLink: string, // 👈 Naya parameter
  file: Express.Multer.File,
) {
  // 1. Check if already submitted
  const existingDoc = await this.submissionRepo.findOne({ where: { groupId, phaseId } });
  if (existingDoc) throw new BadRequestException('Group already submitted for this phase.');

  // 2. AI checking ke liye file memory mein hi process hogi
  const extractedText = await this.extractTextFromFile(file);
  const { score, summary } = await this.checkAiContent(extractedText);

  // 3. Nayi submission create karein
  const newSubmission = this.submissionRepo.create({
    groupId,
    phaseId,
    submittedByStudentId: studentId,
    
    // 👇 Yahan file.originalname ki jagah direct githubLink save karein
    documentUrl: githubLink, 
    
    aiDetectionScore: score,
    aiReportSummary: summary,
  });

  return await this.submissionRepo.save(newSubmission);
  
  // Note: Aapne file ko cloud par save nahi kiya. 
  // Ye memory se check hone ke baad khud destroy ho jayegi.
}
  async getGroupDocumentForEvaluation(groupId: number, phaseId: number) {
    const submission = await this.submissionRepo.findOne({ where: { groupId, phaseId } });
    if (!submission) {
      return {
        hasSubmitted: false,
        message: 'No document has been uploaded by the group for this phase yet.',
      };
    }

    return {
      hasSubmitted: true,
      documentUrl: submission.documentUrl,
      submittedAt: submission.submittedAt,
      aiDetectionScore: Number(submission.aiDetectionScore),
      aiReportSummary: submission.aiReportSummary,
    };
  }

  private async extractTextFromFile(file: Express.Multer.File): Promise<string> {
  if (!file || !file.buffer) {
    throw new BadRequestException('File data is missing.');
  }

  const lowerName = file.originalname.toLowerCase();
  let extractedText = '';

  try {
    if (lowerName.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      extractedText = result.value;
    } else if (lowerName.endsWith('.pdf')) {
      const parsePdf = pdfParse.default || pdfParse;
      const data = await parsePdf(file.buffer);
      extractedText = data.text;
    } else {
      throw new BadRequestException('Only .pdf and .docx are allowed.');
    }

    return extractedText.substring(0, 3000);
  } catch (error) {
    throw new BadRequestException(`Failed to read file: ${error.message}`);
  }
}

  private async checkAiContent(text: string): Promise<{ score: number; summary: string; isSimulated: boolean }> {
    const token = process.env.FYP_DETECTOR;

    if (!token) {
      return { score: 0, summary: 'Security token missing. AI scan skipped.', isSimulated: true };
    }

    const cleanText = text.replace(/[\n\r\t]/g, ' ').trim();

    if (!cleanText || cleanText.length < 50) {
      return {
        score: 0,
        summary: 'Not enough extractable text in the document to run AI detection reliably.',
        isSimulated: true,
      };
    }

    const truncatedText = cleanText.substring(0, 2000);
    const modelUrl = 'https://router.huggingface.co/hf-inference/models/Hello-SimpleAI/chatgpt-detector-roberta';

    try {
      const response = await axios.post(
        modelUrl,
        {
          inputs: truncatedText,
          options: { wait_for_model: true, use_cache: false },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          timeout: 20000,
        },
      );

      const outputs = Array.isArray(response.data) ? response.data[0] : null;
      if (!Array.isArray(outputs)) {
        throw new Error('Unexpected response structure from HF router.');
      }

      const normalize = (s: string) => (s || '').toLowerCase();
      const fakeData = outputs.find((item: any) => {
        const label = normalize(item.label);
        return (
          label === 'generated' ||
          label === 'fake' ||
          label === 'ai' ||
          label === 'label_1' ||
          label.includes('generated') ||
          label.includes('fake')
        );
      });

      if (!fakeData) {
        throw new Error('Could not locate AI-generated label in model output.');
      }

      const aiScore = parseFloat((fakeData.score * 100).toFixed(2));

      return {
        score: aiScore,
        summary: `Real-time AI Scan: ${aiScore}% AI-generated content detected.`,
        isSimulated: false,
      };
    } catch (error) {
      const fallbackScore = parseFloat((Math.random() * 20 + 5).toFixed(2));

      return {
        score: fallbackScore,
        summary: `AI Scan (Simulation Mode — detector unreachable). Detected ${fallbackScore}% traces. This is NOT a real score, please verify manually.`,
        isSimulated: true,
      };
    }
  }

 
  async getStudentMarksByPhase(groupId: number, phaseId: number) {
    try {
      const [phase, scores, status] = await Promise.all([
        this.phaseRepo.findOne({ where: { id: phaseId }, relations: ['rubrics'] }),
        this.evalRepo.find({
          where: {
            group: { id: groupId },
            rubric: { phase: { id: phaseId } },
          },
          relations: ['rubric', 'evaluator', 'evaluator.user'],
          select: {
            id: true,
            marks: true,
            feedback: true,
            rubric: { id: true, maxMarks: true },
            evaluator: { id: true, user: { id: true, name: true } },
          },
        }),
        this.groupStatusRepo.findOne({ where: { groupId, phaseId } }),
      ]);

      if (!phase) throw new NotFoundException('Phase not found');

      if (!scores || scores.length === 0) {
        return {
          success: true,
          message: 'Is phase ke marks abhi upload nahi hue.',
          data: [],
        };
      }

      const phaseWeight = phase.weight;
      const totalMaxMarks = phase.rubrics.reduce((sum, r) => sum + r.maxMarks, 0);
      const totalObtainedMarks = scores.reduce((sum, s) => sum + s.marks, 0)
      const solidMarksObtained = status?.isLocked
        ? Number(status.obtainedWeightedScore)
        : totalMaxMarks > 0
          ? parseFloat(((totalObtainedMarks / totalMaxMarks) * phaseWeight).toFixed(2))
          : 0;

      return {
        success: true,
        message: 'Marks fetched and calculated successfully',
        phaseId,
        groupId,
        phaseWeight,
        totalRawObtained: totalObtainedMarks,
        totalRawMax: totalMaxMarks,
        solidMarksObtained,
        data: scores,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new Error('Marks fetch karte waqt server error aaya.');
    }
  }
}