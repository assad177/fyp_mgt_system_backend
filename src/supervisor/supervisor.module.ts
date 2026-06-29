import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supervisor } from './entities/supervisor.entity';
import { SupervisorService } from './supervisor.service';
import { SupervisorController } from './supervisor.controller';
import { User } from 'src/users/entities/user.entity';
import { SupervisorRequest } from './entities/supervison.request.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Student } from 'src/students/entities/student.entity';
import { ProposalEvaluationCommittee } from 'src/proposal-evaluation/proposal-evaluation-committee.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Supervisor,User,SupervisorRequest,Group,Student,ProposalEvaluationCommittee])],
  controllers: [SupervisorController],
  providers: [SupervisorService],
  exports:[SupervisorService]
})
export class SupervisorModule {}