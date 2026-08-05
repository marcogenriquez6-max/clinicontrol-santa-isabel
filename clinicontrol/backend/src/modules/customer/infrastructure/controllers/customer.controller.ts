import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../../../../common/decorators/roles.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CustomerService } from '../../application/customer.service';
import {
  CreateCustomerDto,
  UpdateCustomerDto,
  CreateContactInfoDto,
  CreateAddressDto,
  CreateInteractionDto,
} from '../dto/customer.dto';

@ApiTags('Customers')
@Controller('customers')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth()
@Roles('admin', 'recepcionista', 'secretaria')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los clientes con paginación' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'accountStatusId', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Lista de clientes' })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('accountStatusId') accountStatusId?: number,
  ): Promise<unknown> {
    return this.customerService.findAll({
      page,
      limit,
      search,
      accountStatusId,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un cliente por ID' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente encontrado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente creado' })
  async create(@Body(ValidationPipe) dto: CreateCustomerDto) {
    return this.customerService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({ status: 200, description: 'Cliente actualizado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: UpdateCustomerDto,
  ) {
    return this.customerService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar un cliente (soft delete)' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  @ApiResponse({ status: 204, description: 'Cliente eliminado' })
  @ApiResponse({ status: 404, description: 'Cliente no encontrado' })
  async delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.delete(id);
  }

  @Get(':id/contacts')
  @ApiOperation({ summary: 'Obtener contactos de un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  async getContactInfos(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getContactInfos(id);
  }

  @Post(':id/contacts')
  @ApiOperation({ summary: 'Agregar contacto a un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  async addContactInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: CreateContactInfoDto,
  ) {
    return this.customerService.addContactInfo(id, dto);
  }

  @Delete(':id/contacts/:contactId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar contacto' })
  async deleteContactInfo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
  ) {
    return this.customerService.deleteContactInfo(id, contactId);
  }

  @Get(':id/addresses')
  @ApiOperation({ summary: 'Obtener direcciones de un cliente' })
  @ApiParam({ name: 'id', description: 'UUID del cliente' })
  async getAddresses(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getAddresses(id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Agregar dirección a un cliente' })
  @ApiBody({ type: CreateAddressDto })
  async addAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: CreateAddressDto,
  ) {
    return this.customerService.addAddress(id, dto);
  }

  @Delete(':id/addresses/:addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAddress(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ) {
    return this.customerService.deleteAddress(id, addressId);
  }

  @Get(':id/interactions')
  @ApiOperation({ summary: 'Obtener interacciones de un cliente' })
  @ApiQuery({ name: 'type', required: false, type: String })
  @ApiQuery({ name: 'completed', required: false, type: Boolean })
  async getInteractions(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('type') type?: string,
    @Query('completed') completed?: boolean,
  ) {
    return this.customerService.getInteractions(id, { type, completed });
  }

  @Post(':id/interactions')
  @ApiOperation({ summary: 'Crear interacción con cliente' })
  async addInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(ValidationPipe) dto: CreateInteractionDto,
  ) {
    return this.customerService.addInteraction(id, dto);
  }

  @Post(':id/interactions/:interactionId/complete')
  @ApiOperation({ summary: 'Completar interacción' })
  async completeInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('interactionId', ParseUUIDPipe) interactionId: string,
  ) {
    return this.customerService.completeInteraction(id, interactionId);
  }

  @Delete(':id/interactions/:interactionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteInteraction(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('interactionId', ParseUUIDPipe) interactionId: string,
  ) {
    return this.customerService.deleteInteraction(id, interactionId);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: 'Obtener timeline del cliente' })
  async getTimeline(@Param('id', ParseUUIDPipe) id: string) {
    return this.customerService.getTimeline(id);
  }
}
