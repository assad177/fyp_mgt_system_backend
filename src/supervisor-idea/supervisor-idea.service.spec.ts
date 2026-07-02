import { Test, TestingModule } from '@nestjs/testing';
import { SupervisorIdeaService } from './supervisor-idea.service';

describe('SupervisorIdeaService', () => {
  let service: SupervisorIdeaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SupervisorIdeaService],
    }).compile();

    service = module.get<SupervisorIdeaService>(SupervisorIdeaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
