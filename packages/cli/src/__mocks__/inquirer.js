/**
 * Mock for inquirer module
 * Used in tests to avoid ES module import issues
 */
module.exports = {
  prompt: jest.fn((questions) => {
    // Return empty answers by default
    // Tests can override this behavior if needed
    return Promise.resolve({})
  }),
}
