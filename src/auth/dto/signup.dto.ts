export class SignupDto {
  name: string;
  email: string;
  password: string;

  role: 'student' | 'supervisor' | 'pec' | 'fyp_office';

  regNo?: string;
  fatherName?: string;
  department?: string;

  expertise?: string[];
  designation?: string;
}