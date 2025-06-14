import { makeDeps } from './deps.js';

const main = async () => {
  const { app } = makeDeps();

  await app.start();
};

void main();
