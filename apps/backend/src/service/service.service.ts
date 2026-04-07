import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceJobDto, UpdateServiceJobDto, AddServicePartsDto, AddServiceChargesDto } from './dto/service.dto';

@Injectable()
export class ServiceService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateServiceJobDto) {
    // Generate job number
    const count = await this.prisma.serviceJob.count();
    const jobNumber = `SRV-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

    return this.prisma.serviceJob.create({
      data: {
        jobNumber,
        customerId: dto.customerId,
        customerName: dto.customerName,
        customerPhone: dto.customerPhone,
        productId: dto.productId,
        productName: dto.productName,
        serialNumber: dto.serialNumber,
        issue: dto.issue,
        priority: dto.priority || 'NORMAL',
        warrantyStatus: dto.warrantyStatus || 'OUT_OF_WARRANTY',
        status: 'PENDING',
        notes: dto.notes,
      },
    });
  }

  async getJob(id: string) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id },
      include: {
        parts: true,
        charges: true,
      },
    });

    if (!job) {
      throw new NotFoundException('Service job not found');
    }

    return job;
  }

  async getAll(status?: string, priority?: string) {
    const where: any = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;

    return this.prisma.serviceJob.findMany({
      where,
      include: {
        parts: true,
        charges: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async update(id: string, dto: UpdateServiceJobDto) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id },
    });

    if (!job) {
      throw new NotFoundException('Service job not found');
    }

    const data: any = { ...dto };
    if (dto.completedDate) data.completedDate = new Date(dto.completedDate);
    if (dto.deliveredDate) data.deliveredDate = new Date(dto.deliveredDate);

    return this.prisma.serviceJob.update({
      where: { id },
      data,
    });
  }

  async addParts(dto: AddServicePartsDto) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Service job not found');
    }

    const parts = dto.parts.map(part => ({
      ...part,
      jobId: dto.jobId,
    }));

    await this.prisma.servicePart.createMany({
      data: parts,
    });

    // Update actual cost
    const totalPartsCost = dto.parts.reduce((sum, p) => sum + (p.cost * p.quantity), 0);
    const currentCost = job.actualCost || 0;

    await this.prisma.serviceJob.update({
      where: { id: dto.jobId },
      data: { actualCost: currentCost + totalPartsCost },
    });

    return this.getJob(dto.jobId);
  }

  async addCharges(dto: AddServiceChargesDto) {
    const job = await this.prisma.serviceJob.findUnique({
      where: { id: dto.jobId },
    });

    if (!job) {
      throw new NotFoundException('Service job not found');
    }

    const charges = dto.charges.map(charge => ({
      ...charge,
      jobId: dto.jobId,
    }));

    await this.prisma.serviceCharge.createMany({
      data: charges,
    });

    // Update actual cost
    const totalCharges = dto.charges.reduce((sum, c) => sum + c.amount, 0);
    const currentCost = job.actualCost || 0;

    await this.prisma.serviceJob.update({
      where: { id: dto.jobId },
      data: { actualCost: currentCost + totalCharges },
    });

    return this.getJob(dto.jobId);
  }

  async getByCustomer(customerId: string) {
    return this.prisma.serviceJob.findMany({
      where: { customerId },
      include: {
        parts: true,
        charges: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getStats() {
    const [total, pending, inProgress, completed] = await Promise.all([
      this.prisma.serviceJob.count(),
      this.prisma.serviceJob.count({ where: { status: 'PENDING' } }),
      this.prisma.serviceJob.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.serviceJob.count({ where: { status: 'COMPLETED' } }),
    ]);

    return { total, pending, inProgress, completed };
  }
}
