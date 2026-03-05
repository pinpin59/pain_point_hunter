import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto, RegisterDto, User } from '@pain-point-hunter/shared';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<{ token: string; user: User }> {
    const user = await this.userService.create(dto);
    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: this.userService.toPublic(user) };
  }

  async login(dto: LoginDto): Promise<{ token: string; user: User }> {
    const user = await this.userService.findByEmail(dto.email);

    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });
    return { token, user: this.userService.toPublic(user) };
  }

  async me(userId: string): Promise<User> {
    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException();
    return this.userService.toPublic(user);
  }
}
