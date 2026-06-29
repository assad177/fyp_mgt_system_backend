import { Controller,Get,Param ,Req,BadRequestException,Query} from '@nestjs/common';
import { StudentsService } from './students.service';

@Controller('students')
export class StudentsController {
    constructor(private readonly studentService:StudentsService){}

    @Get('my-committee/:studentId')
async getMyCommittee(@Param('studentId') studentId: number) {
    console.log('requests for api',studentId)
  return await this.studentService.getMyCommittee(studentId);
}
@Get('dashboard')
async getMyDashboard(@Req() req, @Query('studentId') queryStudentId?: string) {
  
  // 1. ✨ OPTIONAL CHAINING (?.) ✨
  // Agar user logged in hai toh token se ID uthao, nahi toh URL ke query param se uthao
  const studentId = req.user?.studentId || queryStudentId;

  // 2. Agar dono jagah se koi ID nahi mili, toh crash hone ki bajaye client ko error do
  if (!studentId) {
    throw new BadRequestException(
      'Student ID missing! Please provide ?studentId=NUMBER in URL or pass a valid login token.'
    );
  }

  // 3. Service ko number convert karke bhejien
  return this.studentService.getStudentDashboard(Number(studentId));
}
}
