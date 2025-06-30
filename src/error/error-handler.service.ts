import { 
  BadRequestException, 
  Injectable, 
  InternalServerErrorException, 
  Logger, 
  NotFoundException 
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';


export type EntityOperation = 'create' | 'update' | 'delete' | 'find' | 'toggle' | 'start';
type EntityType = 'workout' | 'exercise' | 'exerciseSet' | string;




@Injectable()
export class ErrorHandlerService {
    private readonly logger = new Logger(ErrorHandlerService.name);
    

    handleError(
        error: unknown,
        operation: EntityOperation,
        entityType: EntityType,
        entityId?: string, 
        customerMessage?: string
    ): never {

        this.logError(error, operation, entityType, entityId);

        if(error instanceof PrismaClientKnownRequestError) {
            this.handlePrismaError(error, operation, entityType, entityId);
        }

        if(
            error instanceof BadRequestException ||
            error instanceof NotFoundException ||
            error  instanceof InternalServerErrorException
        ) {
            throw error;
        }
        const message = customerMessage || `Failed to ${operation} ${entityType}${entityId ? ` with ID ${entityId}` : ''}.`;

        switch(operation) {
            case 'find':
                throw new NotFoundException(message);
                case 'create':
                case 'update':
                case 'delete':
                case 'toggle':
                case 'start':
                    throw new InternalServerErrorException(message);
                default:
                    throw new InternalServerErrorException(message);
        }

       

    }

    private logError(
        error: unknown,
        operation: EntityOperation,
        entityType: EntityType,
        entityId?: string
    ): void {
        const errorMsg = `Error during ${operation} ${entityType}${entityId ? ` with ID ${entityId}` : ''}: ${error instanceof Error ? error.message : String(error)}`;
        this.logger.error(errorMsg, error instanceof Error ? error.stack : undefined);
    }

    private handlePrismaError(
        error: PrismaClientKnownRequestError,
        operation: EntityOperation,
        entityType: EntityType,
        entityId?: string
    ): never {
        const entityRef = entityId ? `${entityType} with ID ${entityId}` : entityType;
        // Example: handle unique constraint violation
        if (error.code === 'P2002') {
            const message = `A ${entityType} with the provided unique field(s) already exists.`;
            throw new BadRequestException(message);
        }
        if(error.code==='P2003') {
            throw new BadRequestException(`Invalid refrences for ${entityRef}`)
        }
        if(error.code === 'P2028') {
            throw new BadRequestException('Operation time out');
        }
        // Example: handle not found
        if (error.code === 'P2025') {
            const message = `${entityType.charAt(0).toUpperCase() + entityType.slice(1)}${entityId ? ` with ID ${entityId}` : ''} not found.`;
            throw new NotFoundException(message);
        }
        // Fallback for other Prisma errors
        throw new InternalServerErrorException(`Database error during ${operation} ${entityType}${entityId ? ` with ID ${entityId}` : ''}.`);
    }

}