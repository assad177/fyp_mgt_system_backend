import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { StudentsModule } from './students/students.module';
import { AuthModule } from './auth/auth.module';
import { ProposalModule } from './proposal/proposal.module';
import { GeminiModule } from './gemini/gemini.module';
import { UsersModule } from './users/users.module';
import { ProposalEvaluationModule } from './proposal-evaluation/proposal-evaluation.module';
import { FypOfficeModule } from './fyp-office/fyp-office.module';
import { SupervisorModule } from './supervisor/supervisor.module';
import { ChatModule } from './chat/chat.module';
import { GroupsModule } from './groups/groups.module';
import { CommitteeAssignmentModule } from './committee-assignment/committee-assignment.module';

import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './config/typeOrm.config';
import { JwtModule } from '@nestjs/jwt';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';

import { MailerModule } from '@nestjs-modules/mailer'; 
import { EvaluationModule } from './evaluation/evaluation.module';
import { SupervisorIdeaModule } from './supervisor-idea/supervisor-idea.module';
import * as multer from 'multer';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRoot({
      ...AppDataSource.options,
      autoLoadEntities: true,
    }),

    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret123',
      signOptions: { expiresIn: '1d' },
    }),

    MulterModule.register({
      storage: multer.memoryStorage(),
    }),
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.EMAIL_PASS,
        },
      },
    }),

    UsersModule,
    StudentsModule,
    AuthModule,
    ProposalModule,
    GeminiModule,
    ProposalEvaluationModule,
    FypOfficeModule,
    SupervisorModule,
    ChatModule,
    GroupsModule,
    CommitteeAssignmentModule,
    EvaluationModule,
    SupervisorIdeaModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}