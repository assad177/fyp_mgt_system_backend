import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }
  async updatePassword(email: string, newPasswordHash: string) {
    await this.usersRepository.update({ email }, { password: newPasswordHash });
  }
  
  async create(data: {
    name: string;
    email: string;
    password: string;
    role: 'student' | 'supervisor' | 'pec' | 'fyp_office';
  }): Promise<User> {
    
    const user = this.usersRepository.create({
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role,
    });

    return this.usersRepository.save(user);
  }
}