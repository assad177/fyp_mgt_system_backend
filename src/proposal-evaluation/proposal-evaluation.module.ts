import { Module } from '@nestjs/common';
import { ProposalEvaluationController } from './proposal-evaluation.controller';
import { ProposalEvaluationService } from './proposal-evaluation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Proposal } from 'src/proposal/entities/proposal.entity';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';
import { ProposalEvaluationCommittee } from './proposal-evaluation-committee.entity';
import { Student } from 'src/students/entities/student.entity';

@Module({
  imports:[TypeOrmModule.forFeature([Proposal,Supervisor,ProposalEvaluationCommittee,Student])],
  controllers: [ProposalEvaluationController],
  providers: [ProposalEvaluationService]
})
export class ProposalEvaluationModule {}
