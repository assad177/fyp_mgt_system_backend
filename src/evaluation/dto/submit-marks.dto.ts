export class SubmitMarksDto {
  groupId: number;
  evaluatorId: number; // Current committee member
  scores: {
    rubricId: number;
    marks: number;
    feedback?: string;
  }[];
}