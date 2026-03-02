import { Module } from '@nestjs/common';
import { TrustpilotController } from './trustpilot.controller';
import { TrustpilotService } from './trustpilot.service';

@Module({
  controllers: [TrustpilotController],
  providers: [TrustpilotService],
})
export class TrustpilotModule {}
