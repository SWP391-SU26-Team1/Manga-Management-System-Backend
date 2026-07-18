// Mock @gradio/client to prevent ESM import syntax error in CommonJS Jest environment
jest.mock('@gradio/client', () => ({
  Client: jest.fn(),
  handle_file: jest.fn(),
}));
