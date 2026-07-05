import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,NotFoundException
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { StudentsService } from '../students/students.service';
import { SupervisorService } from '../supervisor/supervisor.service';
import * as bcrypt from 'bcrypt';
import { InjectRepository } from '@nestjs/typeorm';
import { Supervisor } from 'src/supervisor/entities/supervisor.entity';
import { Repository } from 'typeorm';
import { Student } from 'src/students/entities/student.entity';
import { User } from 'src/users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly studentsService: StudentsService,
    private readonly supervisorService: SupervisorService, 
    @InjectRepository(Supervisor) private readonly supervisorRepo:Repository<Supervisor>,
    @InjectRepository(Student) private readonly studentRepo:Repository<Student>,
    @InjectRepository(User) private readonly usersRepositoty:Repository<User>,


  ) {}

  async signup(data: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'supervisor' | 'pec' | 'fyp_office';
    regNo?: string;
    fatherName?: string;
    department?: string;
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

 async searchUser(role: string, query: string) {
    if (role === 'student') {
      // Query is Registration Number
      const student = await this.studentsService.findByRegNo(query);
      if (!student || !student.user) {
        throw new NotFoundException('Student not found with this Registration Number');
      }
      return { 
        id: student.user.id, 
        name: student.user.name, 
        email: student.user.email, 
        regNo: student.regNo, 
        department: student.department 
      };
    } else if (role === 'supervisor') {
      // Query is Email
      const user = await this.usersService.findByEmail(query);
      if (!user || user.role !== 'supervisor') {
        throw new NotFoundException('Supervisor not found with this Email');
      }
      return { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
      };
    }
    throw new BadRequestException('Invalid role provided');
  }
  async adminResetPassword(email: string, newPassword: string) {
    // 1. Check if user exists via UsersService
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException(`No user found with email: ${email}`);
    }
    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // 3. Update the password via UsersService
    await this.usersService.updatePassword(email, hashedPassword);
    return { success: true, message: 'Password reset successfully' };
  }
}