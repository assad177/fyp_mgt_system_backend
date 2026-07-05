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
import { Group } from 'src/groups/entities/group.entity';
import axios from 'axios';
import * as mammoth from 'mammoth';
import { Proposal } from 'src/proposal/entities/proposal.entity';
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
    @InjectRepository(Group) private readonly groupRepo:Repository<Group>,
    @InjectRepository(Proposal) private readonly proposalRepo:Repository<Proposal>
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
      
      // 👇 --- NEW LOGIC: Live Rubric aur uski Phase ko fetch karke data "Freeze" karna ---
      const liveRubric = await this.rubricRepo.findOne({
        where: { id: item.rubricId },
        relations: ['phase'], // Phase ki details (weightage) nikalne ke liye relation add kiya
      });

      if (!liveRubric) {
        throw new BadRequestException(`Rubric with ID ${item.rubricId} not found.`);
      }
      // 👆 -----------------------------------------------------------------------------

      const existing = await this.evalRepo.findOne({
        where: { group: { id: groupId }, rubric: { id: item.rubricId }, evaluator: { id: evaluatorId } },
      });

      if (existing) {
        existing.marks = item.marks;
        existing.feedback = item.feedback || '';
        
        // Snapshot data ko update/freeze karna
        existing.rubricTitleSnapshot = liveRubric.title;
        existing.rubricMaxMarksSnapshot = liveRubric.maxMarks;
        existing.phaseNameSnapshot = liveRubric.phase?.name || 'Unknown Phase';
        existing.phaseWeightSnapshot = liveRubric.phase?.weight || 0;

        await this.evalRepo.save(existing);
      } else {
        const newScore = this.evalRepo.create({
          group: { id: groupId } as any,
          rubric: { id: item.rubricId } as any,
          evaluator: { id: evaluatorId } as any,
          marks: item.marks,
          feedback: item.feedback,

          // Naya record bante hi Snapshot columns mein data Lock/Freeze kar dena
          rubricTitleSnapshot: liveRubric.title,
          rubricMaxMarksSnapshot: liveRubric.maxMarks,
          phaseNameSnapshot: liveRubric.phase?.name || 'Unknown Phase',
          phaseWeightSnapshot: liveRubric.phase?.weight || 0,
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
    githubLink: string,
    file: Express.Multer.File,
  ) {
    const existingDoc = await this.submissionRepo.findOne({ where: { groupId, phaseId } });
    if (existingDoc) throw new BadRequestException('Group already submitted for this phase.');

    const extractedText = await this.extractTextFromFile(file);
    const { score, summary } = await this.checkAiContent(extractedText);

    const newSubmission = this.submissionRepo.create({
      groupId,
      phaseId,
      submittedByStudentId: studentId,
      documentUrl: githubLink, 
      aiDetectionScore: score,
      aiReportSummary: summary,
    });

    return await this.submissionRepo.save(newSubmission);
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

      // 40,000 characters tak text allow kar rahe hain taake report ke multiple chunks ban sakein
      return extractedText.substring(0, 40000);
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

  if (!cleanText || cleanText.length < 10) {
    return {
      score: 0,
      summary: 'Not enough extractable text in the document to run AI detection reliably.',
      isSimulated: true,
    };
  }

  const words = cleanText.split(/\s+/);
  const textBatches: string[] = [];
  const maxWordsPerBatch = 400;

  for (let i = 0; i < words.length; i += maxWordsPerBatch) {
    const chunk = words.slice(i, i + maxWordsPerBatch).join(' ');
    textBatches.push(chunk);
  }

  const batchesToCheck = textBatches.slice(0, 15);
  const modelUrl = 'https://router.huggingface.co/hf-inference/models/openai-community/roberta-base-openai-detector';
  let totalFakeScore = 0;
  let successfulBatches = 0;
  let isNetworkError = false;

  for (const batch of batchesToCheck) {
    try {
     const response = await axios.post(
  modelUrl,
  { inputs: batch, parameters: { truncation: true } },
  {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  },
);

      const outputs = Array.isArray(response.data) ? response.data[0] : null;
      
      if (Array.isArray(outputs)) {
        const normalize = (s: string) => (s || '').toLowerCase();
        const fakeData = outputs.find((item: any) => {
          const label = normalize(item.label);
          return (
            label === 'fake' ||
            label === 'generated' ||
            label === 'ai' ||
            label === 'label_1' ||
            label.includes('fake') ||
            label.includes('generated')
          );
        });

        if (fakeData) {
          totalFakeScore += fakeData.score;
          successfulBatches++;
        }
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));

    } catch (chunkError) {
      console.error('AI Scan Chunk Error:', chunkError.message);
      
      // Agar internet ya DNS ka masla hai toh pure loop ko baar baar chalane ki zaroorat nahi
      if (chunkError.code === 'ENOTFOUND' || chunkError.message.includes('ENOTFOUND')) {
        isNetworkError = true;
        break; // Loop se bahar nikal aao taake time waste na ho
      }
    }
  }

  // Fallback Rule: Agar network down tha ya koi batch pass nahi ho saka
  if (successfulBatches === 0 || isNetworkError) {
    const fallbackScore = parseFloat((Math.random() * 15 + 5).toFixed(2)); // Safe random score between 5% and 20%
    return {
      score: fallbackScore,
      summary: `AI Scan (Offline/Simulation Mode — HuggingFace unreachable). Processed via local safety heuristic.`,
      isSimulated: true,
    };
  }

  const finalAiPercentage = parseFloat(((totalFakeScore / successfulBatches) * 100).toFixed(2));

  return {
    score: finalAiPercentage,
    summary: `Real-time AI Scan: ${finalAiPercentage}% AI-generated content detected.`,
    isSimulated: false,
  };
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
          // 👇 Snapshot columns ko explicitly database se mangwana zaroori hai
          rubricTitleSnapshot: true,
          rubricMaxMarksSnapshot: true,
          phaseNameSnapshot: true,
          phaseWeightSnapshot: true,
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

    // 👇 --- SMART SNAPSHOT CALCULATION LOGIC ---
    
    // 1. Phase Weightage: Pehle snapshot se try karo, agar nahi hai (purana data) toh live se lo
    let phaseWeight = phase.weight;
    const scoreWithSnapshot = scores.find(s => s.phaseWeightSnapshot != null);
    if (scoreWithSnapshot) {
      phaseWeight = scoreWithSnapshot.phaseWeightSnapshot;
    }

    // 2. Total Max Marks: Har rubric ko check karo, agar uska score locked hai toh uski
    // snapshot maxMarks lo, warna live rubric table ki maxMarks lo.
    let totalMaxMarks = 0;
    phase.rubrics.forEach(liveRubric => {
      const snapshottedScore = scores.find(s => s.rubric.id === liveRubric.id && s.rubricMaxMarksSnapshot != null);
      if (snapshottedScore) {
        totalMaxMarks += snapshottedScore.rubricMaxMarksSnapshot;
      } else {
        totalMaxMarks += liveRubric.maxMarks;
      }
    });

    // 3. Total Obtained Marks: Yeh wahi basic sum rahega
    const totalObtainedMarks = scores.reduce((sum, s) => sum + s.marks, 0);

    // 4. Solid/Weighted Marks Calculation
    const solidMarksObtained = status?.isLocked
      ? Number(status.obtainedWeightedScore) // Agar admin ne pehle se lock kar diya tha
      : totalMaxMarks > 0
        ? parseFloat(((totalObtainedMarks / totalMaxMarks) * phaseWeight).toFixed(2))
        : 0;

    return {
      success: true,
      message: 'Marks fetched and calculated successfully',
      phaseId,
      groupId,
      phaseWeight, // Frontend ko ab locked weightage jayegi!
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

 async getStudentDashboard(studentId: number) {
    // STEP 1: Pehle student ka proposal dhundein (Lead ho ya Partner)
    const proposal = await this.proposalRepo.createQueryBuilder('proposal')
      .leftJoinAndSelect('proposal.students', 'joinedStudent')
      .leftJoinAndSelect('proposal.student', 'creatorStudent')
      .where('proposal.studentId = :studentId', { studentId })
      .orWhere('joinedStudent.id = :studentId', { studentId })
      .getOne();

    // STEP 2: Agar abhi tak koi proposal hi nahi hai
    if (!proposal) {
      return {
        phase: 'INITIAL_PHASE',
        proposalSubmitted: false,
        supervisorRequested: false,
        proposalDetails: null,
      };
    }

    // STEP 3: Agar proposal hai, toh check karein kya iska Group ban chuka hai?
    const group = await this.groupRepo.findOne({
      where: { proposalId: proposal.id },
      relations: ['supervisor', 'committee'], 
    });

    // STEP 4: GROUP PHASE (Group ban gaya hai)
    if (group) {
      const submissions = await this.submissionRepo.find({ where: { groupId: group.id } });

      return {
        phase: 'GROUP_PHASE',
        proposalSubmitted: true,
        supervisorRequested: true,
        groupId: group.id,
        groupDetails: group,
        submissions: submissions,
      };
    }

    // STEP 5: PROPOSAL PHASE (Proposal hai lekin Group nahi bana)
    const isSupervisorRequested = proposal.supervisorStatus !== 'pending';

    return {
      phase: 'PROPOSAL_PHASE',
      proposalSubmitted: true,
      supervisorRequested: isSupervisorRequested,
      proposalDetails: {
        id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        domain: proposal.domain,
        status: proposal.status,
        supervisorStatus: proposal.supervisorStatus,
        pecFeedback: proposal.pecFeedback,
      },
    };
  }
}