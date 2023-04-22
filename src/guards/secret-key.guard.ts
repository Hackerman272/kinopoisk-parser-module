import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { AppModule } from '../app.module';
import {Reflector} from "@nestjs/core";
import { ConfigService } from '@nestjs/config';

// разграничение доступов к эндпоинтам
// Injectable для возможности использования в контроллере
@Injectable()
export class SecretKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}
  async canActivate(context: ExecutionContext) {
    try {
      // берём токен из хедеров, чтобы по нему затем провести проверку прав
      const request = context.switchToHttp().getRequest()
      const secret_token = this.configService.get<string>('SECRET_API_ADMIN_KEY');
      const token = request.headers.secret;


      if (!token) {
        throw new UnauthorizedException({message: "Пользователь не авторизован"})
      }

      if (token === secret_token) {
        return true;
      }
    } catch(error) {
      console.log(error)
      throw new HttpException("нет доступа", HttpStatus.FORBIDDEN)
    }
  }
}
