import {  gemini, createAgent } from "@inngest/agent-kit";

import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event }) => {
   
    const codeAgent = createAgent({
  name: "codeAgent",
  system: "You are an expert Next.js Developer. You write readable maintainable code. You write simple Next.js & React.js Snippts",
  model: gemini({ model: "gemini-1.5-flash" , apiKey: process.env.GEMINI_API_KEY }),
});

const { output } = await codeAgent.run(
  `Write the following snippts: ${event.data.value} `,
);
console.log(output);
    
    return { output };
  },
);
