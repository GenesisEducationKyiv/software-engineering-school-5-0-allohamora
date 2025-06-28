import { createContainer } from './container.js';

const main = async () => {
  const { app } = createContainer();

  await app.start();
};

void main();
