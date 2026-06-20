import { build } from 'vite';

try {
  await build();
  console.log('Renderer build completed');
  setTimeout(() => process.exit(0), 100);
} catch (error) {
  console.error(error);
  process.exit(1);
}
