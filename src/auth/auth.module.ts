import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { StudentsModule } from '../students/students.module';
import { SupervisorModule } from 'src/supervisor/supervisor.module';
import { SupervisorService } from 'src/supervisor/supervisor.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';
import { Student } from 'src/students/entities/student.entity';
import { User } from 'src/users/entities/user.entity';
@Module({
  imports: [UsersModule, StudentsModule,SupervisorModule,TypeOrmModule.forFeature([Student,Supervisor,User])],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule { }
