const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ExpenseRepository {
  /**
   * @param {string} filePath - Path to the JSON file store
   */
  constructor(filePath = path.join(__dirname, '..', 'data', 'expenses.json')) {
    this.filePath = filePath;
    this._ensureFileExists();
  }

  /**
   * Ensures the data directory and JSON file exist.
   * Initializes file with an empty array `[]` if it doesn't exist.
   */
  _ensureFileExists() {
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(this.filePath)) {
      this._writeToFile([]);
    }
  }

  /**
   * Reads all expenses from the JSON file.
   * @returns {Array} Array of expense objects
   */
  _readFromFile() {
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (error) {
      // In case of corrupt JSON, default to empty array
      return [];
    }
  }

  /**
   * Safely writes expenses array to JSON file.
   * @param {Array} expenses 
   */
  _writeToFile(expenses) {
    const data = JSON.stringify(expenses, null, 2);
    // Write atomically via a temporary file to avoid corruption
    const tempPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tempPath, data, 'utf8');
    fs.renameSync(tempPath, this.filePath);
  }

  /**
   * Get all expenses, optionally filtered by category or search query
   * @param {Object} options - { category, search }
   * @returns {Array}
   */
  getAll({ category, search } = {}) {
    let expenses = this._readFromFile();

    if (category) {
      const targetCategory = category.toLowerCase().trim();
      expenses = expenses.filter(
        (e) => e.category && e.category.toLowerCase().trim() === targetCategory
      );
    }

    if (search) {
      const query = search.toLowerCase().trim();
      expenses = expenses.filter(
        (e) => e.title && e.title.toLowerCase().includes(query)
      );
    }

    return expenses;
  }

  /**
   * Get a single expense by ID
   * @param {string} id 
   * @returns {Object|null}
   */
  getById(id) {
    const expenses = this._readFromFile();
    return expenses.find((e) => String(e.id) === String(id)) || null;
  }

  /**
   * Add a new expense
   * @param {Object} data - { title, amount, category, date }
   * @returns {Object} Created expense
   */
  add({ title, amount, category, date }) {
    const expenses = this._readFromFile();

    // Round amount to 2 decimal places to prevent floating-point precision issues
    const numericAmount = Math.round(parseFloat(amount) * 100) / 100;

    // Default to current date (YYYY-MM-DD) if date is missing or invalid
    const formattedDate = date && !isNaN(Date.parse(date))
      ? new Date(date).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const newExpense = {
      id: uuidv4(),
      title: title.trim(),
      amount: numericAmount,
      category: category.trim(),
      date: formattedDate
    };

    expenses.push(newExpense);
    this._writeToFile(expenses);

    return newExpense;
  }

  /**
   * Delete an expense by ID
   * @param {string} id 
   * @returns {boolean} true if deleted, false if not found
   */
  delete(id) {
    const expenses = this._readFromFile();
    const index = expenses.findIndex((e) => String(e.id) === String(id));

    if (index === -1) {
      return false;
    }

    expenses.splice(index, 1);
    this._writeToFile(expenses);
    return true;
  }

  /**
   * Calculate overall total and totals per category
   * @returns {Object} { overallTotal, byCategory }
   */
  getTotals() {
    const expenses = this._readFromFile();

    let overallTotal = 0;
    const byCategory = {};

    for (const expense of expenses) {
      const amt = Number(expense.amount) || 0;
      overallTotal += amt;

      const cat = expense.category || 'Uncategorized';
      if (!byCategory[cat]) {
        byCategory[cat] = 0;
      }
      byCategory[cat] += amt;
    }

    // Round totals to 2 decimal places
    overallTotal = Math.round(overallTotal * 100) / 100;
    for (const cat in byCategory) {
      byCategory[cat] = Math.round(byCategory[cat] * 100) / 100;
    }

    return {
      overallTotal,
      byCategory
    };
  }
}

module.exports = ExpenseRepository;
