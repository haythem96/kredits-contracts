const namehash = require('ethers').utils.namehash;

// eslint-disable-next-line no-undef
const Proposal = artifacts.require("Proposal.sol");
// eslint-disable-next-line no-undef
const Contributor = artifacts.require("Contributor.sol");
// eslint-disable-next-line no-undef
const Contribution = artifacts.require("Contribution.sol");

// eslint-disable-next-line no-undef
const getContract = name => artifacts.require(name);
// eslint-disable-next-line no-unused-vars
const { assertRevert } = require('@aragon/test-helpers/assertThrow');

const ZERO_ADDR = '0x0000000000000000000000000000000000000000';

contract('Proposal app', (accounts) => {
  let kernelBase, aclBase, daoFactory, dao, r, acl, proposal, contribution, contributor;

  const root = accounts[0];

  // eslint-disable-next-line no-undef
  before(async () => {
    kernelBase = await getContract('Kernel').new(true); // petrify immediately
    aclBase = await getContract('ACL').new();
    daoFactory = await getContract('DAOFactory').new(kernelBase.address, aclBase.address, ZERO_ADDR);
    r = await daoFactory.newDAO(root);
    dao = getContract('Kernel').at(r.logs.filter(l => l.event == 'DeployDAO')[0].args.dao);
    acl = getContract('ACL').at(await dao.acl());

    //create dao mamnager permission for coin owner
    await acl.createPermission(
      root,
      dao.address,
      await dao.APP_MANAGER_ROLE(),
      root,
      { from: root }
    );

    //apps id
    let appsId = [];
    appsId[0] = namehash("kredits-contribution");
    appsId[1] = namehash("kredits-contributor");
    appsId[2] = namehash("kredits-proposal");
    appsId[3] = namehash("kredits-token");
    

    //get new app instance from DAO
    let receipt = await dao.newAppInstance(
      appsId[2],
      (await Proposal.new()).address,
      0x0,
      false,
      { from: root }
    );
    proposal = Proposal.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    );
    
    receipt = await dao.newAppInstance(
      appsId[1],
      (await Contributor.new()).address,
      0x0,
      false,
      { from: root }
    );
    contributor = Contributor.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    );
    
    receipt = await dao.newAppInstance(
      appsId[0],
      (await Contribution.new()).address,
      0x0,
      false,
      { from: root }
    );
    contribution = Contribution.at(
      receipt.logs.filter(l => l.event == 'NewAppProxy')[0].args.proxy
    );
    
    //init app
    await proposal.initialize(appsId);
    await acl.createPermission(
      root,
      proposal.address,
      await proposal.ADD_PROPOSAL_ROLE(),
      root,
      { from: root }
    );
    await acl.createPermission(
      root,
      proposal.address,
      await proposal.VOTE_PROPOSAL_ROLE(),
      root,
      { from: root }
    );
    
    //init contribution (app)
    await contribution.initialize(appsId);
    await acl.createPermission(
      root,
      contribution.address,
      await contribution.ADD_CONTRIBUTION_ROLE(),
      root,
      { from: root }
    );
    await acl.createPermission(
      root,
      contribution.address,
      await contribution.VETO_CONTRIBUTION_ROLE(),
      root,
      { from: root }
    );
    await acl.grantPermission(proposal.address, contribution.address, await contribution.ADD_CONTRIBUTION_ROLE(), {from: root});            
    
    //init contributor app
    await contributor.initialize(root, appsId);
    await acl.createPermission(
      root,
      contributor.address,
      await contributor.MANAGE_CONTRIBUTORS_ROLE(),
      root,
      { from: root }
    );
    
  });

  describe("Owner default permissions", async () => {
    it('check owner can add proposal', async () => {
      let addProposalPermission = await acl.hasPermission(root, proposal.address, await proposal.ADD_PROPOSAL_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(addProposalPermission, true);
    });  

    it('check owner can veto contribution', async () => {
      let vetoProposalPermission = await acl.hasPermission(root, proposal.address, await proposal.VOTE_PROPOSAL_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(vetoProposalPermission, true);
    });  

    it('check owner can add contribution', async () => {
      let addContributionPermission = await acl.hasPermission(root, contribution.address, await contribution.ADD_CONTRIBUTION_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(addContributionPermission, true);
    });   
    
    it('check proposal app can add contribution', async () => {
      let addContributionPermission = await acl.hasPermission(proposal.address, contribution.address, await contribution.ADD_CONTRIBUTION_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(addContributionPermission, true);
    });  
    
    it('check owner can veto contribution', async () => {
      let vetoContributionPermission = await acl.hasPermission(root, contribution.address, await contribution.VETO_CONTRIBUTION_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(vetoContributionPermission, true);
    });  

    it('check owner can manage contributors', async () => {
      let manageContributorsPermission = await acl.hasPermission(root, contributor.address, await contributor.MANAGE_CONTRIBUTORS_ROLE());
      // eslint-disable-next-line no-undef
      assert.equal(manageContributorsPermission, true);
    });  
  });

  describe('Add proposal', async () => {
    let contributorId;
    let account = root;
    let amount = 10;
    let hashDigest = '0x0';
    let hashFunction = 0;
    let hashSize = 0;
    
    // eslint-disable-next-line no-undef
    before(async () => {
      // add contributor
      await contributor.addContributor(account, hashDigest, hashFunction, hashSize);
      contributorId = await contributor.contributorsCount();
      // eslint-disable-next-line no-undef
      assert.equal(await contributor.exists(contributorId), true);
    });
    
    it('add proposal', async () => {
      let proposalCountBefore = await proposal.proposalsCount();
      await proposal.addProposal(contributorId.toNumber(), amount, hashDigest, hashFunction, hashSize, {from: root});
      let proposalCountAfter = await proposal.proposalsCount();
      // eslint-disable-next-line no-undef
      assert.equal(await proposalCountAfter.toNumber(), parseInt(proposalCountBefore)+1, "proposal added");
      let proposalObject = await proposal.getProposal(proposalCountAfter.toNumber());
      // eslint-disable-next-line no-undef
      assert.equal(proposalObject[11], true, "proposal exist");
    });

  });

});
