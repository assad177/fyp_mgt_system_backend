import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProposalController } from './proposal.controller';
import { ProposalService } from './proposal.service';
import { Proposal } from './entities/proposal.entity';
import { ExistingProject } from './entities/existing-project.entity';
import { GeminiModule } from '../gemini/gemini.module';
import { Student } from 'src/students/entities/student.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Proposal, ExistingProject,Student]),
    GeminiModule,
  ],
  controllers: [ProposalController],
  providers: [ProposalService],
  exports: [ProposalService],
})
export class ProposalModule { }
