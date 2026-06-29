import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

@Post('login')
async login(@Body() body: { email: string; password: string }) {
    console.log(body); 
    // body.email ke andar Reg No bhi ho sakta hai aur Email bhi
    return this.authService.validateUser(body.email, body.password);
}

   @Post('signup')
signup(@Body() body: SignupDto) {
  return this.authService.signup(body);
}
}
