import { Module } from '@nestjs/common';
import { EvaluationController } from './evaluation.controller';
import { EvaluationService } from './evaluation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from 'src/groups/entities/group.entity';
import { EvaluationPhase } from './entities/evaluation-phase.entity';
import { Rubric } from './entities/rubric.entity';
import { EvaluationScore } from './entities/evaluation-score.entity';
import { GroupPhaseStatus } from './entities/group-phase-status.entity';
import { MilestoneSubmission } from './entities/milestone-submission.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Group,EvaluationPhase,Rubric,EvaluationScore,GroupPhaseStatus,MilestoneSubmission])],
  controllers: [EvaluationController],
  providers: [EvaluationService]
})
export class EvaluationModule {}
