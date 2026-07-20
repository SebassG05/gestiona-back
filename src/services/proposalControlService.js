import { readFileSync } from 'node:fs';
import ProposalControl from '../models/ProposalControl.js';
import portalRepository from '../repositories/portalRepository.js';
import proposalRepository from '../repositories/proposalRepository.js';

const repeat = (section, count) => Array(count).fill(section);
const TEMPLATE_INDICATORS = readFileSync(
  new URL('../data/proposalControlIndicators.txt', import.meta.url),
  'utf8'
)
  .split(/\r?\n/)
  .map((indicator) => indicator.trim())
  .filter(Boolean);
const TEMPLATE_SECTIONS = [
  ...repeat('Preparación / identificación', 3),
  'Part A / formularios administrativos',
  'Part A / presupuesto',
  'Part A / ética y seguridad',
  ...repeat('Control formal', 3),
  'Control formal / uso de IA',
  ...repeat('1.1 Objectives and ambition', 9),
  ...repeat('1.2 Methodology', 12),
  ...repeat('2.1 Project’s pathways towards impact', 7),
  ...repeat('2.2 Measures to maximise impact – Dissemination, exploitation and communication', 10),
  ...repeat('2.3 Summary (optional)', 6),
  ...repeat('3.1 Work plan and resources', 3),
  '3.1a List of work packages',
  ...repeat('3.1b Work package description', 3),
  ...repeat('3.1c List of deliverables', 4),
  '3.1d List of milestones',
  '3.1e Critical risks for implementation',
  '3.1f Summary of staff effort',
  '3.1g Subcontracting costs',
  '3.1h Purchase costs – major equipment',
  ...repeat('3.1 Work plan and resources', 3),
  ...repeat('3.2 Capacity of participants and consortium as a whole', 7),
  ...repeat('Annexes to Part B – if applicable', 4),
  ...repeat('Control de calidad final', 4),
];

if (TEMPLATE_SECTIONS.length !== 88 || TEMPLATE_INDICATORS.length !== 88) {
  throw new Error('La plantilla de control debe contener exactamente 88 filas');
}

const defaultItems = () =>
  TEMPLATE_SECTIONS.map((section, index) => ({
    order: index + 1,
    section,
    indicator: TEMPLATE_INDICATORS[index],
    status: 'No iniciado',
    progress: 0,
    versions: Array(9).fill(null),
  }));

const assertAccess = async ({ portalId, proposalId, userId }) => {
  const [portal, proposal] = await Promise.all([
    portalRepository.findById(portalId),
    proposalRepository.findByIdAndPortal(proposalId, portalId),
  ]);
  if (!portal || !portal.members.some((member) => member.equals(userId))) {
    const error = new Error('No tienes acceso a este portal');
    error.statusCode = portal ? 403 : 404;
    throw error;
  }

  if (!proposal) {
    const error = new Error('La propuesta no existe');
    error.statusCode = 404;
    throw error;
  }
  return proposal;
};

const sanitizeItems = (items) => {
  if (!Array.isArray(items) || items.length > 150) {
    const error = new Error('La tabla de control no es valida');
    error.statusCode = 400;
    throw error;
  }

  return items.map((item, index) => ({
    order: index + 1,
    section: String(item.section || '').trim(),
    indicator: String(item.indicator || '').trim(),
    weight: item.weight === '' || item.weight == null ? null : Number(item.weight),
    status: item.status,
    progress: Number(item.progress) || 0,
    responsible: String(item.responsible || '').trim(),
    pendingAction: String(item.pendingAction || '').trim(),
    lastReview: item.lastReview || null,
    versions: Array.from({ length: 9 }, (_, version) => {
      const value = item.versions?.[version];
      return value === '' || value == null ? null : Number(value);
    }),
    notes: String(item.notes || '').trim(),
  }));
};

const proposalControlService = {
  get: async ({ portalId, proposalId, userId }) => {
    const proposal = await assertAccess({ portalId, proposalId, userId });
    let control = await ProposalControl.findOne({ portal: portalId, proposal: proposalId }).lean();
    if (!control) {
      control = await ProposalControl.create({
        portal: portalId,
        proposal: proposalId,
        updatedBy: userId,
        items: defaultItems(),
        templateVersion: 3,
      });
      control = control.toObject();
    } else if (control.templateVersion !== 3 || control.items.length !== TEMPLATE_SECTIONS.length) {
      const nextItems = defaultItems().map((templateItem, index) => {
        const existingItem = control.items.length === 88 ? control.items[index] : null;
        if (!existingItem) return templateItem;
        return {
          ...templateItem,
          ...existingItem,
          section: templateItem.section,
          indicator: existingItem.indicator || templateItem.indicator,
          order: index + 1,
        };
      });
      control = await ProposalControl.findOneAndUpdate(
        { portal: portalId, proposal: proposalId },
        { $set: { items: nextItems, templateVersion: 3, updatedBy: userId } },
        { new: true, runValidators: true }
      ).lean();
    }
    return { proposal, control };
  },

  save: async ({ portalId, proposalId, userId, items }) => {
    await assertAccess({ portalId, proposalId, userId });
    return ProposalControl.findOneAndUpdate(
      { portal: portalId, proposal: proposalId },
      { $set: { items: sanitizeItems(items), updatedBy: userId, templateVersion: 3 } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
  },
};

export default proposalControlService;
