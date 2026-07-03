import { Module } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { GroupsController } from './groups.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Group } from './entities/group.entity';
import { Committee } from 'src/committee-assignment/entities/committee.entity';
import { Student } from 'src/students/entities/student.entity';
@Module({
  imports:[TypeOrmModule.forFeature([Group,Committee,Student])],
  providers: [GroupsService],
  controllers: [GroupsController]
})
export class GroupsModule {}
