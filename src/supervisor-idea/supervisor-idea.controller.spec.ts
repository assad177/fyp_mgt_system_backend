import { Test, TestingModule } from '@nestjs/testing';
import { SupervisorIdeaController } from './supervisor-idea.controller';

describe('SupervisorIdeaController', () => {
  let controller: SupervisorIdeaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SupervisorIdeaController],
    }).compile();

    controller = module.get<SupervisorIdeaController>(SupervisorIdeaController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
