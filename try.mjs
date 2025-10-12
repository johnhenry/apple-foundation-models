import { LanguageModelSession } from './dist/index.mjs';

const session = new LanguageModelSession();
const stream = session.streamResponse('Write a story');

for await (const chunk of stream) {
  process.stdout.write(chunk);
}

// const stream = await session.respond('Write a story');

// console.log(stream);

