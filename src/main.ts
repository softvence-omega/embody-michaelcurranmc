import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import helmet from 'helmet';
import { PrismaService } from './prisma/prisma.service';

dotenv.config();
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.use(helmet())
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    method: 'GET, HEAD, POST, PUT, DELETE, OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    Credentials: true,
  })
  const prismaService = app.get(PrismaService);
  // await prismaService.enableShutdownHooks(app);
  
  const port = process.env.PORT ?? 3000
  await app.listen(port);
  
  console.log(`Application is running on : ${port}`)
}
bootstrap();

