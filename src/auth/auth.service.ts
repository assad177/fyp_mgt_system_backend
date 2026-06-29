import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { SupervisorService } from '../supervisor/supervisor.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly supervisorService: SupervisorService, 
  ) {}

  async signup(data: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'supervisor' | 'pec' | 'fyp_office';

    // student
    regNo?: string;
    fatherName?: string;
    department?: string;

    // supervisor
    expertise?: string[];
    designation?: string;
  }) {
    const existingUser = await this.usersService.findByEmail(data.email);

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    if (!data.role) {
      throw new BadRequestException('Role is required');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    // 1️⃣ CREATE USER (COMMON)
    const user = await this.usersService.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      role: data.role,
    });

    if (data.role === 'student') {
      if (!data.regNo) {
        throw new BadRequestException('RegNo is required for student');
      }

      await this.studentsService.create({
        userId: user.id,
        regNo: data.regNo,
        fatherName: data.fatherName || '',
        department: data.department || '',
      });
    }

    if (data.role === 'supervisor') {
      if (!data.expertise || !data.designation) {
        throw new BadRequestException(
          'Expertise & designation required for supervisor',
        );
      }

      await this.supervisorService.create({
        userId: user.id,
        expertise: data.expertise || '',
        designation: data.designation || '',
      });
    }

    return {
      message: 'Account created successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  
  async validateUser(identifier: string, password: string) {
    let user:any = null;
    if (identifier.includes('@')) {
      user = await this.usersService.findByEmail(identifier);
    } 
    
    else {
      const student = await this.studentsService.findByRegNo(identifier);
      user = student?.user;
    }

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.signIn(user);
  }

  async signIn(user: any) {
    let studentId: number | null = null;
    let supervisorId: number | null = null;

    if (user.role === 'student') {
      const student = await this.studentsService.findByUserId(user.id);
      studentId = student?.id || null;
    }

    if (user.role === 'supervisor') {
      const supervisor = await this.supervisorService.findByUserId(user.id);
      supervisorId = supervisor?.id || null;
    }

    const payload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      studentId,
      supervisorId,
    };

    const token = await this.jwtService.signAsync(payload);

    return {
      accessToken: token,
      user: payload,
      message: 'Login successful',
    };
  }
}