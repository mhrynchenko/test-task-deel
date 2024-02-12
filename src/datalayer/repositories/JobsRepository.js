const Sequelize = require('sequelize');
const { sequelize, CONTRACT_STATUSES, PROFILE_ROLES } = require('../model');

class JobsRepository {
  constructor() {
    this.models = sequelize.models;
  }

  async getUnpaidJobsForRoles(
    profileID,
    roles = [PROFILE_ROLES.CLIENT, PROFILE_ROLES.CONTRACTOR]
  ) {
    const { Job, Contract } = this.models;
    const arrRoleFilter = [];

    if (roles.includes(PROFILE_ROLES.CLIENT)) {
      arrRoleFilter.push({ '$Contract.ClientId$': profileID });
    }

    if (roles.includes(PROFILE_ROLES.CONTRACTOR)) {
      arrRoleFilter.push({ '$Contract.ContractorId$': profileID });
    }

    return await Job.findAll({
      include: {
        model: Contract,
        where: {
          [Sequelize.Op.and]: [
            { status: CONTRACT_STATUSES.IN_PROGRESS },
            Sequelize.or(...arrRoleFilter)
          ]
        },
        attributes: []
      },
      where: {
        paid: {
          [Sequelize.Op.eq]: null
        }
      }
    });
  }
}

module.exports = { JobsRepository };
