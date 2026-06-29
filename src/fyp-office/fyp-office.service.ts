import axios from 'axios';
import FormData from 'form-data';
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExistingProject } from '../proposal/entities/existing-project.entity';

@Injectable()
export class FypOfficeService {
  constructor(
    @InjectRepository(ExistingProject)
    private readonly existingRepo: Repository<ExistingProject>,
  ) {}


  async saveProposal(body: any, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('File is required');
    }

 
    const aiResponse = await this.getEmbeddings(body, file);

    const data = aiResponse?.data || aiResponse;
    const embeddings = data?.embeddings || data;

    if (!embeddings) {
      throw new BadRequestException('Embeddings not returned from AI service');
    }

   
    let domains: string[] = [];

    if (body.domains && Array.isArray(body.domains)) {
      domains = body.domains;
    } else if (body.domain) {
      domains = [body.domain];
    }

    // clean domains (AI → ai → AI)
    domains = domains.map(d => d.toUpperCase().trim());

 
    const project = this.existingRepo.create({
      title: data?.title || body.title,
      description: data?.description || body.description || '',
      domains: domains,
      fileUrl: '',

     
      titleEmbedding:
        embeddings.titleEmbedding ??
        embeddings.title_embedding ??
        null,

      scopeEmbedding:
        embeddings.scopeEmbedding ??
        embeddings.scope_embedding ??
        null,

      modulesEmbedding:
        embeddings.modulesEmbedding ??
        embeddings.modules_embedding ??
        null,
    });

    await this.existingRepo.save(project);

    return {
      message: 'Existing proposal saved successfully',
      existingProjectId: project.id,
    };
  }

 
  private async getEmbeddings(
    body: any,
    file: Express.Multer.File,
  ) {
    const url = process.env.PYTHON_SERVER_IP!;

    const form = new FormData();

    form.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype,
    });

    form.append('title', body.title || '');
    form.append('description', body.description || '');
    form.append('domain', body.domain || '');

    try {
      const res = await axios.post(url, form, {
        headers: form.getHeaders(),
        timeout: 60000,
      });

      return res.data;
    } catch (error) {
      console.error('AI SERVICE ERROR:', error?.response?.data || error.message);
      throw new BadRequestException('AI embedding service failed');
    }
  }
}