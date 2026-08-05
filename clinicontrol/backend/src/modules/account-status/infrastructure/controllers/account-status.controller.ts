import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AccountStatusService } from '../../application/account-status.service';
import { Roles } from '../../../../common/decorators/roles.decorator';

@ApiTags('Account Status')
@ApiBearerAuth()
@Controller('account-status')
@Roles('admin', 'medico', 'recepcionista', 'secretaria')
export class AccountStatusController {
  constructor(private readonly service: AccountStatusService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los estados de cuenta' })
  findAll() {
    return this.service.findAll();
  }
}
