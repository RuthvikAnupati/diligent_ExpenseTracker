const express = require('express');
const ExpenseRepository = require('./repository');
const setupSwagger = require('./swagger');

function createApp(repositoryInstance = null) {
  const app = express();
  const repository = repositoryInstance || new ExpenseRepository();

  app.use(express.json());
  app.use(express.static(require('path').join(__dirname, '..', 'public')));

  // Mount Swagger UI documentation at /docs
  setupSwagger(app);

  /**
   * @openapi
   * /expenses:
   *   post:
   *     summary: Add a new expense
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/ExpenseInput'
   *     responses:
   *       201:
   *         description: Expense created successfully
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Expense'
   *       400:
   *         description: Invalid input data
   */
  app.post('/expenses', (req, res) => {
    const { title, amount, category, date } = req.body || {};

    // Input Validation
    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required and must be a non-empty string.' });
    }

    if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) <= 0) {
      return res.status(400).json({ error: 'Amount is required and must be a positive number greater than 0.' });
    }

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({ error: 'Category is required and must be a non-empty string.' });
    }

    if (date && isNaN(Date.parse(date))) {
      return res.status(400).json({ error: 'Date must be a valid date format (e.g., YYYY-MM-DD).' });
    }

    const newExpense = repository.add({ title, amount, category, date });
    return res.status(201).json(newExpense);
  });

  /**
   * @openapi
   * /expenses/totals:
   *   get:
   *     summary: Calculate overall total expenses and totals grouped by category
   *     responses:
   *       200:
   *         description: Total expenses summary
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/TotalsResponse'
   */
  app.get('/expenses/totals', (req, res) => {
    const totals = repository.getTotals();
    return res.status(200).json(totals);
  });

  /**
   * @openapi
   * /expenses:
   *   get:
   *     summary: View all expenses (supports category filter and keyword search)
   *     parameters:
   *       - in: query
   *         name: category
   *         schema:
   *           type: string
   *         description: Filter expenses by category
   *       - in: query
   *         name: search
   *         schema:
   *           type: string
   *         description: Search keyword in expense title
   *     responses:
   *       200:
   *         description: List of expenses
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Expense'
   */
  app.get('/expenses', (req, res) => {
    const { category, search } = req.query;
    const expenses = repository.getAll({ category, search });
    return res.status(200).json(expenses);
  });

  /**
   * @openapi
   * /expenses/{id}:
   *   get:
   *     summary: View a single expense by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Expense found
   *       404:
   *         description: Expense not found
   */
  app.get('/expenses/:id', (req, res) => {
    const expense = repository.getById(req.params.id);
    if (!expense) {
      return res.status(404).json({ error: `Expense with ID '${req.params.id}' not found.` });
    }
    return res.status(200).json(expense);
  });

  /**
   * @openapi
   * /expenses/{id}:
   *   delete:
   *     summary: Delete an expense by ID
   *     parameters:
   *       - in: path
   *         name: id
   *         required: true
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Expense deleted successfully
   *       404:
   *         description: Expense not found
   */
  app.delete('/expenses/:id', (req, res) => {
    const success = repository.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ error: `Expense with ID '${req.params.id}' not found.` });
    }
    return res.status(200).json({ message: 'Expense deleted successfully.' });
  });

  return app;
}

module.exports = createApp;
