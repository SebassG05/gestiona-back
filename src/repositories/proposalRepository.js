import Proposal from '../models/Proposal.js';

const proposalRepository = {
  create: (proposalData) => Proposal.create(proposalData),
};

export default proposalRepository;
