const request = require('supertest');
const fs = require('fs');
const path = require('path');
const os = require('os');
const createApp = require('../src/app');
const ExpenseRepository = require('../src/repository');

describe('Smart Expense Tracker API', () => {
  let tempFilePath;
  let repository;
  let app;

  beforeEach(() => {
    // Create an isolated temporary file for each test
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'expense-test-'));
    tempFilePath = path.join(tempDir, 'test-expenses.json');
    repository = new ExpenseRepository(tempFilePath);
    app = createApp(repository);
  });

  afterEach(() => {
    // Clean up temporary files after test run
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
    const tempDir = path.dirname(tempFilePath);
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe('POST /expenses', () => {
    it('should create a new expense with valid inputs', async () => {
      const payload = {
        title: 'Grocery Shopping',
        amount: 54.25,
        category: 'Food',
        date: '2026-08-01'
      };

      const res = await request(app)
        .post('/expenses')
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBe('Grocery Shopping');
      expect(res.body.amount).toBe(54.25);
      expect(res.body.category).toBe('Food');
      expect(res.body.date).toBe('2026-08-01');
    });

    it('should round amount to 2 decimal places', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          title: 'Coffee',
          amount: 4.999,
          category: 'Food'
        });

      expect(res.status).toBe(201);
      expect(res.body.amount).toBe(5);
    });

    it('should reject missing title', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          amount: 20,
          category: 'Transport'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Title is required/i);
    });

    it('should reject negative or zero amount', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          title: 'Taxi',
          amount: -15,
          category: 'Transport'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/positive number/i);
    });

    it('should reject missing category', async () => {
      const res = await request(app)
        .post('/expenses')
        .send({
          title: 'Bus Ticket',
          amount: 2.50
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/Category is required/i);
    });
  });

  describe('GET /expenses', () => {
    beforeEach(async () => {
      await request(app).post('/expenses').send({ title: 'Lunch', amount: 15.50, category: 'Food' });
      await request(app).post('/expenses').send({ title: 'Dinner', amount: 35.00, category: 'Food' });
      await request(app).post('/expenses').send({ title: 'Flight ticket', amount: 200.00, category: 'Travel' });
    });

    it('should return all expenses', async () => {
      const res = await request(app).get('/expenses');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(3);
    });

    it('should filter expenses by category', async () => {
      const res = await request(app).get('/expenses?category=Food');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(2);
      expect(res.body.every((e) => e.category === 'Food')).toBe(true);
    });

    it('should filter expenses by category case-insensitively', async () => {
      const res = await request(app).get('/expenses?category=travel');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Flight ticket');
    });

    it('should search expenses by title keyword', async () => {
      const res = await request(app).get('/expenses?search=din');

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].title).toBe('Dinner');
    });
  });

  describe('GET /expenses/totals', () => {
    it('should calculate overall total and by category breakdown correctly', async () => {
      await request(app).post('/expenses').send({ title: 'Item 1', amount: 10.10, category: 'Food' });
      await request(app).post('/expenses').send({ title: 'Item 2', amount: 20.20, category: 'Food' });
      await request(app).post('/expenses').send({ title: 'Item 3', amount: 50.00, category: 'Utilities' });

      const res = await request(app).get('/expenses/totals');

      expect(res.status).toBe(200);
      expect(res.body.overallTotal).toBe(80.30);
      expect(res.body.byCategory).toEqual({
        Food: 30.30,
        Utilities: 50.00
      });
    });

    it('should return zero for empty repository', async () => {
      const res = await request(app).get('/expenses/totals');

      expect(res.status).toBe(200);
      expect(res.body.overallTotal).toBe(0);
      expect(res.body.byCategory).toEqual({});
    });
  });

  describe('GET /expenses/:id', () => {
    it('should return expense details for a valid ID', async () => {
      const created = await request(app)
        .post('/expenses')
        .send({ title: 'Book', amount: 12.99, category: 'Education' });

      const id = created.body.id;
      const res = await request(app).get(`/expenses/${id}`);

      expect(res.status).toBe(200);
      expect(res.body.title).toBe('Book');
    });

    it('should return 404 for a non-existent ID', async () => {
      const res = await request(app).get('/expenses/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });

  describe('DELETE /expenses/:id', () => {
    it('should delete an existing expense', async () => {
      const created = await request(app)
        .post('/expenses')
        .send({ title: 'Movie Ticket', amount: 12.00, category: 'Entertainment' });

      const id = created.body.id;

      const deleteRes = await request(app).delete(`/expenses/${id}`);
      expect(deleteRes.status).toBe(200);

      const fetchRes = await request(app).get(`/expenses/${id}`);
      expect(fetchRes.status).toBe(404);
    });

    it('should return 404 when attempting to delete a non-existent expense', async () => {
      const res = await request(app).delete('/expenses/unknown-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toMatch(/not found/i);
    });
  });
});
