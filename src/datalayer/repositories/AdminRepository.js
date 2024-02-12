const Sequelize = require('sequelize');
const { sequelize, CONTRACT_STATUSES, PROFILE_ROLES } = require('../model');

class AdminRepository {
  constructor(logger) {
    this.models = sequelize.models;
    this.logger = logger;
  }

  async getTopProfession(startDate, endDate) {
    const { Profile, Contract, Job } = this.models;

    try {
      const result = await Job.findAll({
        where: {
          paymentDate: {
            [Sequelize.Op.between]: [startDate, endDate]
          },
          paid: true
        },
        include: [
          {
            model: Contract,
            include: [
              {
                model: Profile,
                as: 'Contractor',
                attributes: ['profession']
              }
            ]
          }
        ],
        attributes: [
          [Sequelize.fn('SUM', Sequelize.col('price')), 'totalPrice']
        ],
        group: ['Contract.Contractor.profession'],
        order: [[sequelize.literal('totalPrice'), 'DESC']],
        limit: 1
      });

      return result;
    } catch (error) {
      this.logger.error(error, 'Failed to get top professions.');
    }

    return null;
  }
}

module.exports = { AdminRepository };
