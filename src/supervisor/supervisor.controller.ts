import { Controller, Post,Patch, Body,Get,Param,Query } from '@nestjs/common';
import { SupervisorService } from './supervisor.service';

@Controller('supervisor')
export class SupervisorController {
  constructor(private readonly service: SupervisorService) {}

@Get('all')
getAllSupervisors(@Query('domain') domain: string) {
  console.log('supervisor api called,',domain);
  return this.service.getAllSupervisorsByDomain(domain);
}
  @Get('students/search')
  async getStudentsForSearch(@Query('name') name?: string) {
    return await this.service.searchStudents(name);
  }
  
@Post('send-supervisor-request')
sendSupervisorRequest(@Body() body: any) {
  console.log(body)
  return this.service.sendSupervisorRequest(body);
}

@Get('requests/:supervisorId')
getRequests(@Param('supervisorId') supervisorId: number) {
  console.log("get pending request from student")
  return this.service.getRequests(supervisorId);
}



  @Patch('accept-request/:id')
  async acceptRequest(@Param('id') id: number) {
    return this.service.acceptRequest(Number(id));
  }

}