import { Controller, Post, Body ,BadRequestException,Get,Query} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

@Post('login')
async login(@Body() body: { email: string; password: string }) {
    console.log(body); 
    return this.authService.validateUser(body.email, body.password);
}
@Get('search-user')
  async searchUser(@Query('role') role: string, @Query('query') query: string) {
    return this.authService.searchUser(role, query);
  }
  @Post('admin-reset-password')
  async adminResetPassword(@Body() body: { email: string; newPassword: string }) {
    if (!body.email || !body.newPassword) {
      throw new BadRequestException('Email and new password are required');
    }
    return this.authService.adminResetPassword(body.email, body.newPassword);
  }

   @Post('signup')
signup(@Body() body: SignupDto) {
  return this.authService.signup(body);
}

}
