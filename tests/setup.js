// Set test env vars before any module is loaded
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.INTERNAL_SERVICE_SECRET = 'test-internal-secret';
process.env.SUPABASE_URL = 'http://localhost:54321';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-key';
process.env.CLOUDINARY_CLOUD_NAME = 'test';
process.env.CLOUDINARY_API_KEY = 'test';
process.env.CLOUDINARY_API_SECRET = 'test';
