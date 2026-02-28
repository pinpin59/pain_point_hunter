import { createZodDto } from 'nestjs-zod';
import { FetchSubredditsBodySchema } from '@pain-point-hunter/shared';

export class FetchSubredditsBodyDto extends createZodDto(FetchSubredditsBodySchema) {}
