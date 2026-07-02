import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MailerModule } from '@nestjs-modules/mailer';
import { CommitteeAssignmentController } from './committee-assignment.controller';
import { CommitteeAssignmentService } from './committee-assignment.service';

import { Group } from '../groups/entities/group.entity';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';
import { Committee } from './entities/committee.entity';


import { Proposal } from 'src/proposal/entities/proposal.entity';
import { CommitteeMember } from './entities/committe-members.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Group, Supervisor, Committee,Proposal,CommitteeMember]),
  MailerModule],
  controllers: [CommitteeAssignmentController], // 🔥 IMPORTANT
  providers: [
    CommitteeAssignmentService,
// 🔥 CSP service inject ho raha hai
  ],
})
export class CommitteeAssignmentModule {}