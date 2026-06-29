import { Test, TestingModule } from '@nestjs/testing';
import { CommitteeAssignmentService } from './committee-assignment.service';

describe('CommitteeAssignmentService', () => {
  let service: CommitteeAssignmentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CommitteeAssignmentService],
    }).compile();

    service = module.get<CommitteeAssignmentService>(CommitteeAssignmentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
