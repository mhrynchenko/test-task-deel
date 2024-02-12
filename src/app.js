const express = require('express');
const bodyParser = require('body-parser');
const logger = require('pino-http');
const { sequelize } = require('./datalayer/model');
const { query, param, body, validationResult } = require('express-validator');

const { getProfile } = require('./middleware/getProfile');
const {
  ContractRepository,
  JobsRepository,
  BalanceRepository,
  AdminRepository
} = require('./datalayer/repositories/index');
const { isGreaterThanZero, isValidDate } = require('./validators/index');

const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);
app.use(logger());

// TODO: Split code to separate controllers using router

/**
 * GET /contract/:id
 *
 * @throws {404} Contract not found.
 * @returns contract by id
 */
app.get('/contracts/:id', getProfile, async (req, res) => {
  const { id } = req.params;

  const contractRepo = new ContractRepository();
  const contract = await contractRepo.getContractByID(id, req.profile.id);

  if (!contract) return res.status(404).end();
  res.json(contract);
});

/**
 * GET /contracts
 * Retrieves a list of contracts belonging to a user (client or contractor), containing only non-terminated contracts.
 *
 * @returns {Array} Contracts - An array of contracts.
 */
app.get('/contracts', getProfile, async (req, res) => {
  const contractRepo = new ContractRepository();
  const contracts = await contractRepo.getContracts(req.profile.id);

  res.json(contracts);
});

/**
 * GET /jobs/unpaid
 * Get all unpaid jobs for a user (client or contractor), for active contracts only.
 *
 *  SELECT J.id, J.paid, C.id FROM Jobs AS J JOIN Contracts AS C ON J.ContractId = C.id JOIN Profiles as P ON P.id = C.ClientId OR P.id = C.ContractorId WHERE J.paid IS NULL AND P.id = 1 AND C.status = 'in_progress';
 *
 * @returns {Array} Jobs - An array of unpaid jobs.
 */
app.get('/jobs/unpaid', getProfile, async (req, res) => {
  const jobRepo = new JobsRepository();
  const jobs = await jobRepo.getUnpaidJobsForRoles(req.profile.id);

  res.json(jobs);
});

/**
 * POST /jobs/:job_id/pay
 * Pay for a job.
 *
 * @param {string} job_id - The ID of the job to pay for.
 *
 * @returns {Object} Message - A success message.
 * @throws {404} Job not found.
 * @throws {400} Insufficient balance.
 */
app.post('/jobs/:job_id/pay', getProfile, async (req, res) => {
  // TODO: I don't have time to implement this, here we need to use transactions to guarantee that we won't create new money :)
});

/**
 * POST /balances/deposit/:userId
 * Deposits money into the balance of a client.
 *
 * @param {string} userId - The ID of the user to deposit money for.
 * @param {number} amount - The amount of money to deposit.
 *
 * @returns {Object} Profile - updated profile.
 */
app.post(
  '/balances/deposit/:userId',
  [
    getProfile,
    param('userId').notEmpty().withMessage(`'userId' should not be empty`),
    body('amount')
      .custom(isGreaterThanZero)
      .withMessage(`'amount' should be greater than zero.`)
  ],
  async (req, res) => {
    const result = validationResult(req);

    if (result.isEmpty()) {
      const userId = req.params.userId;
      const amount = parseInt(req.body.amount);

      const balanceRepo = new BalanceRepository(req.log);
      const profile = await balanceRepo.deposit(userId, amount);

      if (!profile) {
        res.status(400).json({ message: 'Failed to deposit money.' });
        return;
      }

      return res.json(profile);
    }

    res.send({ errors: result.array() });
  }
);

/**
 * GET /admin/best-profession
 * Returns the profession that earned the most money.
 *
 * @param {string} start - The start date of the query time range.
 * @param {string} end - The end date of the query time range.
 *
 * @returns {Object} Profession - The profession that earned the most money.
 */
app.get(
  '/admin/best-profession',
  [
    query('start').notEmpty().withMessage(`'start' date can't be empty`),
    query('end').notEmpty().withMessage(`'end' date can't be empty`),
    query('start').custom(isValidDate).withMessage(`'start' date is not valid`),
    query('end').custom(isValidDate).withMessage(`'end' date is not valid`)
  ],
  async (req, res) => {
    const result = validationResult(req);

    if (result.isEmpty()) {
      const start = req.query.start;
      const end = req.query.end;

      const adminRepo = new AdminRepository(req.log);
      const topProfession = await adminRepo.getTopProfession(start, end);

      return res.json(topProfession);
    }

    res.send({ errors: result.array() });
  }
);

/**
 * GET /admin/best-clients
 * Returns the clients that paid the most for jobs in the query time period.
 *
 * @param {string} start - The start date of the query time period.
 * @param {string} end - The end date of the query time period.
 * @param {number} limit - The maximum number of clients to return. Default is 2.
 *
 * @returns {Array} Clients - An array of clients.
 */
app.get('/admin/best-clients', async (req, res) => {
  // TODO: I didn't have time to implement this, however this is an easy one the query should look like this:
  /*
        SELECT Profiles.firstName, Profiles.lastName, SUM(Jobs.price) AS total_paid
        FROM Profiles
        JOIN Contracts ON Profiles.id = Contracts.ClientId
        JOIN Jobs ON Contracts.id = Jobs.ContractId
        WHERE Jobs.paid = true
        GROUP BY Profiles.id
        ORDER BY total_paid DESC
        LIMIT 2;
    */
});

module.exports = app;
