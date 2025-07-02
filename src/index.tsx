import { Container } from './infrastructure/container.js';

const main = async () => {
  const { app } = new Container();

  await app.start();
};

void main();
