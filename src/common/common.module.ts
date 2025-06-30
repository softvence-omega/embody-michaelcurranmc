import { ErrorHandlerService } from "src/error/error-handler.service";
import { Module } from '@nestjs/common';

@Module({
    providers: [ErrorHandlerService],
    exports: [ErrorHandlerService]
})

export class CommonModule {}