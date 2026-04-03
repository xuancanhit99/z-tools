import { HttpStatus, ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./http-exception.filter";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.FE_ORIGIN ?? `http://localhost:${process.env.FE_PORT ?? 3000}`,
    credentials: true,
  });
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY
    })
  );
  const port = Number(process.env.PORT ?? process.env.BE_PORT ?? 8080);
  await app.listen(port);
}

void bootstrap();
