import { Test, TestingModule } from '@nestjs/testing';
import { CommitteeAssignmentController } from './committee-assignment.controller';

describe('CommitteeAssignmentController', () => {
  let controller: CommitteeAssignmentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommitteeAssignmentController],
    }).compile();

    controller = module.get<CommitteeAssignmentController>(CommitteeAssignmentController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
