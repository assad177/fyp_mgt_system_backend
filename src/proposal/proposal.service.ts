import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import axios from 'axios';
import FormData from 'form-data';
import { Repository } from 'typeorm';
import { Proposal } from './entities/proposal.entity';
import { ExistingProject } from './entities/existing-project.entity';
import { GeminiService } from 'src/gemini/gemini.service';

@Injectable()
export class ProposalService {
  constructor(
    @InjectRepository(Proposal)
    private readonly repo: Repository<Proposal>,

    @InjectRepository(ExistingProject)
    private readonly existingProjectRepo: Repository<ExistingProject>,

    private readonly gemini: GeminiService,
  ) {}

  async checkSimilarity(
    body: any,
    file: Express.Multer.File,
    studentId?: number,
  ) {
    if (!file) throw new Error('File is required');

    const response = await this.getEmbeddingsFromPython(body, file);
    const embeddings = response?.embeddings;

    if (!embeddings) {
      throw new Error('Embeddings not returned from Python API');
    }
    const similar = await this.findSimilarProjects(embeddings);

    const highestSimilarity =
      similar.length > 0
        ? similar[0].similarities.weightedSimilarity
        : 0;

    return {
      status: 'ok',
      proposalData: {
        title: response.title,
        description: body.description || '',
        domain: body.domain || '',
        studentId,

        titleEmbedding:
          embeddings.title_embedding ?? embeddings.titleEmbedding ?? [],

        scopeEmbedding:
          embeddings.scope_embedding ?? embeddings.scopeEmbedding ?? [],

        modulesEmbedding:
          embeddings.modules_embedding ?? embeddings.modulesEmbedding ?? [],

        highestSimilarity,
      },

      original: {
        title: response.title,
        scope: response.scope,
        modules: response.modules,
      },

      similarProjects: similar.slice(0, 5),
      highestSimilarity,
    };
  }

  async enhanceProposalWithGemini(data: {
    title: string;
    description: string;
    scope?: string;
    modules?: string | string[];
  }) {
    const enhanced = await this.gemini.enhanceProposal({
      title: data.title,
      description: data.description,
      scope: data.scope,
      modules: data.modules,
    });

    return {
      title: enhanced.title,
      scope: enhanced.scope,
      modules: Array.isArray(enhanced.modules)
        ? enhanced.modules.map((m: any) => m.name || m)
        : [],
    };
  }

  async getStudentProposal(studentId: number) {
    return this.repo.findOne({
      where: { studentId },
      order: { createdAt: 'DESC' },
    });
  }

  async fetchAllProposals() {
    return this.repo.find({
      order: { createdAt: 'DESC' },
    });
  }


  private async getEmbeddingsFromPython(
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
      });

      console.log('PYTHON RESPONSE:', res.data);
      return res.data.data;
    } catch (error) {
      throw new Error(
        error?.response?.data?.error ||
          'PDF processing server not reachable',
      );
    }
  }

  // ================================
  // OPTIMIZED SIMILARITY SEARCH (DATABASE LEVEL + CALIBRATION)
  // ================================
  private async findSimilarProjects(studentEmb: any) {
    // pgvector format ke liye arrays ko string mein convert karna zaroori hai '[0.1, 0.2, ...]'
    const titleStr = `[${studentEmb.title_embedding.join(',')}]`;
    const scopeStr = `[${studentEmb.scope_embedding.join(',')}]`;
    const modulesStr = `[${studentEmb.modules_embedding.join(',')}]`;

    // 1. PostgreSQL + pgvector se direct Cosine Distance (<=>) nikal kar raw weights calculate karein
    const rawResults = await this.existingProjectRepo
      .createQueryBuilder('project')
      .select('project.id', 'id')
      .addSelect('project.title', 'title')
      .addSelect('project.domains', 'projectdomain')
      .addSelect('project.file_url', 'fileUrl')
      // Cosine Similarity = 1 - Cosine Distance
      .addSelect('(1 - (project.title_embedding <=> :title))', 'rawTitle')
      .addSelect('(1 - (project.scope_embedding <=> :scope))', 'rawScope')
      .addSelect('(1 - (project.modules_embedding <=> :modules))', 'rawModules')
      // Raw weighted sum sirf fast sorting ke liye use ho raha hai
      .addSelect(
        `((1 - (project.title_embedding <=> :title)) * 0.5 + 
          (1 - (project.scope_embedding <=> :scope)) * 0.3 + 
          (1 - (project.modules_embedding <=> :modules)) * 0.2)`,
        'rawWeighted'
      )
      .setParameters({ title: titleStr, scope: scopeStr, modules: modulesStr })
      .orderBy('"rawWeighted"', 'DESC')
      .limit(5) // Database se sirf top 5 matches filter honge
      .getRawMany();

    // 2. Sirf top 5 projects par Contrast Stretching (Calibration) apply karein noise saaf karne ke liye
    return rawResults.map((proj) => {
      const calibrate = (sim: number, floor: number) => {
        if (sim <= floor) return 0;
        return (sim - floor) / (1 - floor);
      };

      // Har section ka noise floor set kiya (Is se kam similarity seedha 0% ho jayegi)
      const titleSim = calibrate(parseFloat(proj.rawTitle || '0'), 0.45);   
      const scopeSim = calibrate(parseFloat(proj.rawScope || '0'), 0.40);   
      const modulesSim = calibrate(parseFloat(proj.rawModules || '0'), 0.38); 

      // Final dynamic weights algorithm
      const weighted = titleSim * 0.5 + scopeSim * 0.3 + modulesSim * 0.2;
      const round = (v: number) => Math.round(v * 10000) / 100;

      return {
        id: proj.id,
        title: proj.title,
        projectdomain: proj.projectdomain,
        fileUrl: proj.fileUrl,
        similarities: {
          titleSimilarity: round(titleSim),
          scopeSimilarity: round(scopeSim),
          modulesSimilarity: round(modulesSim),
          weightedSimilarity: round(weighted),
        },
      };
    });
  }
}