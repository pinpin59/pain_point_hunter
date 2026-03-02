import { createZodDto } from 'nestjs-zod';
import { FetchTrustpilotBodySchema } from '@pain-point-hunter/shared';

export class FetchTrustpilotBodyDto extends createZodDto(FetchTrustpilotBodySchema) {}
