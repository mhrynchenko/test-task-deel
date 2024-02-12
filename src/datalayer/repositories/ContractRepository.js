const Sequelize = require('sequelize');
const { sequelize, CONTRACT_STATUSES } = require('../model');

class ContractRepository {
  constructor() {
    const { Contract } = sequelize.models;
    this.model = Contract;
  }

  async getContractByID(contractID, profileID) {
    return await this.model.findOne({
      where: {
        id: contractID,
        [Sequelize.Op.or]: [
          { ClientId: profileID },
          { ContractorId: profileID }
        ]
      }
    });
  }

  async getContracts(profileID) {
    return await this.model.findAll({
      where: {
        [Sequelize.Op.or]: [
          { ClientId: profileID },
          { ContractorId: profileID }
        ],
        status: {
          [Sequelize.Op.ne]: CONTRACT_STATUSES.TERMINATED
        }
      }
    });
  }
}

module.exports = { ContractRepository };
