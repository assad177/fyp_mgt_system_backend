// committee-assignment.service.ts
import { Injectable, Logger,NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, IsNull, DataSource,In } from "typeorm";
import { MailerService } from "@nestjs-modules/mailer";
import { Group } from "../groups/entities/group.entity";
import { Supervisor } from "src/supervisor/entities/supervisor.entity";
import { Committee } from "./entities/committee.entity";
import { Proposal } from "src/proposal/entities/proposal.entity";

@Injectable()
export class CommitteeAssignmentService {
  private logger = new Logger(CommitteeAssignmentService.name);
  private used = new Set<number>();

  constructor(
    @InjectRepository(Group) private groupRepo: Repository<Group>,
    @InjectRepository(Supervisor) private supRepo: Repository<Supervisor>,
    @InjectRepository(Committee) private comRepo: Repository<Committee>,
    @InjectRepository(Proposal) private propRepo: Repository<Proposal>,
    private ds: DataSource,
    private mail: MailerService,
  ) {}

async createCommitteesOnly() {
  this.logger.log("🚀 Creating committees...");
  const qr = this.ds.createQueryRunner();
  await qr.connect();
  await qr.startTransaction();

  try {
    await qr.manager.query('DELETE FROM committees');

    const [groups, sups, props] = await Promise.all([
      qr.manager.find(Group, { where: { committeeId: IsNull() } as any }),
      qr.manager.find(Supervisor),
      qr.manager.find(Proposal),
    ]);

    if (!sups.length) throw new Error("No supervisors");
    if (!groups.length) throw new Error("No groups");

    const pMap = new Map(props.map(p => [p.id, p]));
    this.used.clear();

    
    const comCount = Math.floor(sups.length / 4);
    this.logger.log(`📋 Creating ${comCount} committees for ${sups.length} supervisors and ${groups.length} groups`);

    const coms: Committee[] = [];
    for (let i = 0; i < comCount; i++) {
      const doms = (pMap.get(groups[i % groups.length]?.proposalId)?.domain || []);
      const arr = Array.isArray(doms) ? doms : [doms];

      const mems = [
        this.pick(sups, s => !this.used.has(s.id) && s.designation?.includes("prof") && arr.some(d => s.expertise?.includes(d))) ||
        this.pick(sups, s => !this.used.has(s.id) && s.designation?.includes("prof")),

        this.pick(sups, s => !this.used.has(s.id) && !s.designation?.includes("prof") && arr.some(d => s.expertise?.includes(d))) ||
        this.pick(sups, s => !this.used.has(s.id) && !s.designation?.includes("prof")),
      ];

      for (const s of sups) {
        if (mems.length >= 4) break;
        if (!this.used.has(s.id)) mems.push(s);
      }

      const validMems = mems.filter((m): m is Supervisor => !!m);
      validMems.forEach(m => this.used.add(m.id));

      if (validMems.length >= 2) {
        const c = this.comRepo.create({ 
          name: `Committee-${coms.length + 1}`, 
          members: validMems 
        });
        coms.push(await qr.manager.save(c));
      }
    }

    await qr.commitTransaction();

    return {
      message: "Committees created successfully",
      supervisors: sups.length,
      groups: groups.length,
      committees: coms.length,
      data: coms,
    };
  } catch (e) {
    await qr.rollbackTransaction();
    this.logger.error(e);
    throw e;
  } finally {
    await qr.release();
  }
}

  async assignAndEmail() {
    this.logger.log("🚀 Starting assignment & emails...");
    const qr = this.ds.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const [groups, coms, props] = await Promise.all([
        qr.manager.find(Group, { where: { committeeId: IsNull() } as any }),
        qr.manager.find(Committee, { relations: ['members'] }),
        qr.manager.find(Proposal),
      ]);

      if (!groups.length) return { message: "No unassigned groups" };
      if (!coms.length) return { message: "No committees" };

      const pMap = new Map(props.map(p => [p.id, p]));
      this.used.clear();

      const matrix = this.buildMatrix(groups, coms, pMap);
      const assigns = this.assignGroups(matrix, groups, coms);

      const updates = assigns.map(a => {
        const g = groups.find(gr => gr.id === a.groupId);
        if (g) g.committeeId = a.comId;
        return g;
      }).filter((g): g is Group => !!g);

      if (updates.length) await qr.manager.save(updates);

      await qr.commitTransaction();

      // Send emails after commit
      await this.sendEmails(coms, groups, pMap);

      return {
        message: "Assignment completed & emails sent",
        stats: {
          groups: groups.length,
          committees: coms.length,
          assigned: assigns.length,
        },
      };
    } catch (e) {
      await qr.rollbackTransaction();
      this.logger.error(e);
      throw e;
    } finally {
      await qr.release();
    }
  }

  private async createComs(sups: Supervisor[], groups: Group[], pMap: Map<any, any>, qr: any) {
    const coms: Committee[] = [];
    const max = Math.floor(sups.length / 4);

    for (let i = 0; i < max; i++) {
      const doms = (pMap.get(groups[i % groups.length]?.proposalId)?.domain || []);
      const arr = Array.isArray(doms) ? doms : [doms];

      const mems = [
        this.pick(sups, s => !this.used.has(s.id) && s.designation?.includes("prof") && arr.some(d => s.expertise?.includes(d))) ||
        this.pick(sups, s => !this.used.has(s.id) && s.designation?.includes("prof")),

        this.pick(sups, s => !this.used.has(s.id) && !s.designation?.includes("prof") && arr.some(d => s.expertise?.includes(d))) ||
        this.pick(sups, s => !this.used.has(s.id) && !s.designation?.includes("prof")),
      ];

      for (const s of sups) {
        if (mems.length >= 4) break;
        if (!this.used.has(s.id)) mems.push(s);
      }

      const validMems = mems.filter((m): m is Supervisor => !!m);
      validMems.forEach(m => this.used.add(m.id));

      if (validMems.length === 4 && this.isValid(validMems, arr)) {
        const c = this.comRepo.create({ name: `Committee-${coms.length + 1}`, members: validMems });
        coms.push(await qr.manager.save(c));
      }
    }

    return coms;
  }

  private isValid(mems: Supervisor[], doms: any[]) {
    const hasProf = mems.some(m => m?.designation?.includes("prof"));
    const hasExp = mems.some(m => doms.some(d => m?.expertise?.includes(d)));
    const lecCount = mems.filter(m => !m?.designation?.includes("prof")).length;
    return hasProf || (lecCount >= 2 && hasExp);
  }

  private buildMatrix(groups: Group[], coms: Committee[], pMap: Map<any, any>) {
    return groups.map(g => {
      const dom = pMap.get(g.proposalId)?.domain;
      const doms = Array.isArray(dom) ? dom : [dom];

      return coms.map(c => {
        let sc = 0;
        c.members?.forEach(m => {
          doms.forEach(d => sc += m.expertise?.includes(d) ? 50 : 0);
          sc += m.designation?.includes("prof") ? 25 : 0;
        });
        return sc;
      });
    });
  }

  private assignGroups(matrix: number[][], groups: Group[], coms: Committee[]) {
    const load = new Map(coms.map(c => [c.id, 0]));
    const order = groups.map((_, i) => i).sort((a, b) => Math.max(...matrix[a]) - Math.max(...matrix[b]));
    const res: any[] = [];

    for (const gi of order) {
      let best = -1, score = -1;

      for (let ci = 0; ci < coms.length; ci++) {
        const curLoad = load.get(coms[ci].id) ?? 0;
        if (curLoad >= 4) continue;
        if (coms[ci].members?.some(m => m.id === groups[gi].supervisorId)) continue;

        if (matrix[gi][ci] > score) {
          score = matrix[gi][ci];
          best = ci;
        }
      }

      if (best !== -1) {
        res.push({ groupId: groups[gi].id, comId: coms[best].id });
        load.set(coms[best].id, (load.get(coms[best].id) ?? 0) + 1);
      }
    }

    return res;
  }

private async sendEmails(coms: Committee[], groups: Group[], pMap: Map<any, any>) {
  try {
    await Promise.allSettled(
      coms.map(async (c) => {
        const ags = await this.groupRepo.find({
          where: { committeeId: c.id },
          relations: ['proposal', 'supervisor', 'supervisor.user'],
        });

        if (!ags.length) return;

        
        const groupNames = ags.map(g => `Group ${g.id}`).join(', ');
        const membersList = c.members?.map(m => `${m.user?.name} (${m.designation})`).join(', ');

        const html = `
          <div style="font-family: Arial; line-height: 1.6; max-width: 600px;">
            <h2>Committee Assignment - ${c.name}</h2>
            
            <h3>Your Committee Members:</h3>
            <p>${membersList}</p>
            
            <h3>Your Assigned Groups:</h3>
            <p><strong>${groupNames}</strong></p>
            
            <hr style="margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              View full details and other information on your dashboard.
            </p>
          </div>
        `;

        if (!c.members || c.members.length === 0) return;

        await Promise.allSettled(
          c.members.map((m) =>
            this.mail.sendMail({
              to: m.user?.email,
              subject: `FYP Committee Assignment - ${c.name}`,
              html,
            }).catch((e) => this.logger.warn(`Email failed: ${m.user?.email}`)),
          ),
        );
      }),
    );
  } catch (e) {
    this.logger.warn('Email batch failed');
  }
}

  private pick(sups: Supervisor[], fn: (s: Supervisor) => boolean) {
    return sups.find(fn);
  }

  async updateCommittees(data: { 
    committeeId: number; 
    name?: string; 
    memberIds?: number[]; 
    groupIds?: number[]; 
}) {
    const committee = await this.comRepo.findOne({ 
        where: { id: data.committeeId }, 
        relations: ['members', 'groups'] 
    });

    if (!committee) throw new NotFoundException('Committee not found');

    // 1. Name update
    if (data.name) committee.name = data.name;

    // 2. Members update (Transfer logic)
    if (data.memberIds) {
        committee.members = await this.supRepo.findBy({ id: In(data.memberIds) });
    }

    // 3. Groups update (Drag and Drop ya Move logic)
    if (data.groupIds) {
        committee.groups = await this.groupRepo.findBy({ id: In(data.groupIds) });
    }

    return await this.comRepo.save(committee);
}
}