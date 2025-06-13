import { makeDeps } from './deps.js';

const main = () => {
  const { app } = makeDeps();

  app.start();
};

void main();
