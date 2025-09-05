import {Sandbox} from "@e2b/code-interpreter"
import {  gemini, createAgent } from "@inngest/agent-kit";

import { inngest } from "./client";
import { getSandbox } from "./utils";


export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    const SandboxId = await step.run("get-sandbox-id" , async () => {
      const sandbox= await Sandbox.create("whis-nextjs-text-2");
      return sandbox.sandboxId;
    });
   
    const codeAgent = createAgent({
  name: "codeAgent",
  system: "You are an expert Next.js Developer. You write readable maintainable code. You write simple Next.js & React.js Snippts",
  model: gemini({ model: "gemini-1.5-flash" , apiKey: process.env.GEMINI_API_KEY }),
});

const { output } = await codeAgent.run(
  `Write the following snippts: ${event.data.value} `,
);

  const sandboxUrl = await step.run("get-sandbox-url", async () => {
    const sandbox = await getSandbox(SandboxId);
    const host =  sandbox.getHost(3000);
    return `https://${host}`;
  })
    
    return { output, sandboxUrl };
  },
);
