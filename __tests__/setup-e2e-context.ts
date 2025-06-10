import './mocks';
import { clearDb, disconnectFromDb, runMigrations } from 'src/db.js';

beforeAll(async () => {
  await runMigrations();
});

afterEach(async () => {
  await clearDb();
});

afterAll(async () => {
  await disconnectFromDb();
});
