import { Container } from './container.js';

const main = async () => {
  const { app } = new Container();

  await app.start();
};

void main();
