import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { Student } from './entities/student.entity';
import { Group } from 'src/groups/entities/group.entity';
import { Proposal } from 'src/proposal/entities/proposal.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student,Group,Proposal])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule { }
