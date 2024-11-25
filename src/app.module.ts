import { Module } from '@nestjs/common';
import { SessionGateway } from './Session.gateway';

@Module({
  imports: [],
  providers: [SessionGateway],  // Register your gateway
  controllers: []
})
export class AppModule {}