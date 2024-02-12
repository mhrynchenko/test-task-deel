const Sequelize = require('sequelize');
const { sequelize, PROFILE_ROLES } = require('../model');
const { JobsRepository } = require('./JobsRepository');

const MAX_DEPOSIT_PERCENTAGE = 0.25;

class BalanceRepository {
  constructor(logger) {
    this.logger = logger;
    this.models = sequelize.models;
  }

  // TODO: Do we need to check that user depositing money to his own account?
  async deposit(userId, amount) {
    const { Profile } = this.models;
    const jobRepo = new JobsRepository();
    const jobsToPay = await jobRepo.getUnpaidJobsForRoles(userId, [
      PROFILE_ROLES.CLIENT
    ]);

    const sumToPay = jobsToPay.reduce((acc, curr) => {
      acc += curr.price;
      return acc;
    }, 0);

    const maxAllowedDeposit = sumToPay * MAX_DEPOSIT_PERCENTAGE;

    if (amount <= maxAllowedDeposit) {
      try {
        const profile = await Profile.findOne({ where: { id: userId } });

        if (profile) {
          const newBalance = profile.balance + amount;

          return await profile.update({ balance: newBalance });
        } else {
          this.logger.info(`Profile with id ${userId} is not found.`);
        }
      } catch (error) {
        this.logger.error(error, 'Failed to save balance.');
      }
    } else {
      this.logger.info(
        `Provided amount (${amount}) is greater then allowed max (${maxAllowedDeposit}).`
      );
    }

    return null;
  }
}

module.exports = { BalanceRepository };
