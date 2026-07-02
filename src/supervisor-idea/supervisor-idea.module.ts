import { Module } from '@nestjs/common';
import { SupervisorIdeaService } from './supervisor-idea.service';
import { SupervisorIdeaController } from './supervisor-idea.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectIdea } from './entities/projectidea.entity';

@Module({
  imports:[TypeOrmModule.forFeature([ProjectIdea])],
  providers: [SupervisorIdeaService],
  controllers: [SupervisorIdeaController]
})
export class SupervisorIdeaModule {}
