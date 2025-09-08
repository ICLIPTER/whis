import {z} from "zod";
import { Sandbox} from "@e2b/code-interpreter"
import {  gemini, createAgent, createTool, createNetwork, Tool } from "@inngest/agent-kit";

import { PROMPT } from "@/prompt";
import { prisma } from "@/lib/db";

import { inngest } from "./client";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: {[path: string]: string};
};


export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code-agent/run" },
  async ({ event, step }) => {
    const SandboxId = await step.run("get-sandbox-id" , async () => {
      const sandbox= await Sandbox.create("whis-nextjs-text-2");
      return sandbox.sandboxId;
    });
   
    const codeAgent = createAgent<AgentState>({
  name: "code-agent",
  description : "An expert Coding agent",
  system: PROMPT,
  model: gemini({ 
    model: "gemini-1.5-flash" , apiKey: process.env.GEMINI_API_KEY 
  }),

  tools: [
        createTool({
          name: "terminal",
          description: "Run commands inside the sandbox terminal",
          parameters: z.object({
            command: z.string(),
          }), 
  
      handler : async ({ command }, {step}) => {
        return await step?.run("terminal", async () => {
          const buffers = { stdout: "", stderr:""};

          try {
            const sandbox = await getSandbox(SandboxId);
            const result = await sandbox.commands.run(command, {
              onStdout: (data:string) => {
                buffers.stdout += data;
              },
              onStderr: (data:string) => {
                buffers.stderr += data;
              }
            });
            return result.stdout;
          } catch (e) {
            console.error(
              `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`
            );
              return `Command failed: ${e} \nstdout: ${buffers.stdout} \nstderr: ${buffers.stderr}`;
          }
        });
      },
    }),
     createTool({
        name: "createOrUpdateFiles",
        description: "Create or update files in the sandbox",
        parameters: z.object({
          files: z.array(
            z.object({
              path: z.string(),
              content: z.string(),
            }),
          ),
        }),
        handler: async (
          {files},
          {step, network}: Tool.Options<AgentState>
        ) => {
          const newFiles = await step?.run("createOrUpdateFiles", async () => {
          try {
            const updatedFiles = network.state.data.files || {};
            const sandbox = await getSandbox(SandboxId);
            for (const file of files) {
              await sandbox.files.write(file.path, file.content);
              updatedFiles[file.path] = file.content;
            }
            return updatedFiles;
          } catch(e) {
            return "Error: " + e;           
          }
        });

        if(typeof  newFiles === "object" ) {
          network.state.data.files = newFiles;
           }
         }
      }),
      createTool({
        name : "readFiles",
        description: "Read files in the sandbox",
        parameters: z.object ({
          files: z.array(z.string()),
        }),
        handler: async ({files}, {step}) => {
          return await step?.run("readFiles", async () => {
            try {
              const sandbox = await getSandbox(SandboxId);
              const contents = [];
              for (const file of files) {
                const content = await sandbox.files.read(file);
                contents.push({path: file, content});
              }
              return JSON.stringify(contents);
            } catch (e) {
              return "Error: " + e;
            }
          })

        },
      })
    ],
    lifecycle: {
      onResponse: async ({ result, network}) => {
     const lastAssistantMessageText = 
     lastAssistantTextMessageContent(result);
     
     if (lastAssistantMessageText  && network){
      if (lastAssistantMessageText.includes("<task_summary>")) {
        network.state.data.summary = lastAssistantMessageText;
      }
     }

     return result;
    },  
  },
});

const network =  createNetwork({
  name: "coding-agent-network",
  agents: [codeAgent],
  maxIter: 15,
  router: async ({network}) => {
    const summary = network.state.data.summary;
    if (summary) {
      return;
  }
  return codeAgent;
},

});

const result = await network.run(event.data.value);

const isError =
!result.state.data.summary || 
Object.keys(result.state.data.files || {}).length === 0;


    const sandboxUrl = await step.run("get-sandbox-url", async () => {
    const sandbox = await getSandbox(SandboxId);
    const host =  sandbox.getHost(3000);
    return `https://${host}`;
  });

  await step.run("save-result", async () => {
    if(isError) {
      return await prisma.message.create({
        data: {
          content: "Something went wrong. Please try again.",
          role: "ASSISTANT",
          type: "ERROR",
        }
      })
    }

    return await prisma.message.create({
      data: {
      content: result.state.data.summary,
      role: "ASSISTANT",
      type: "RESULT",
      fragment: {
        create:{
          sandboxUrl: sandboxUrl,
          title: "Fragmnet",
          files: result.state.data.files,
        }
      },
     },
   })
  });

    return { 
      url: sandboxUrl,
      title: "Fragmnet",
      files: result.state.data.files,
      summary: result.state.data.summary,
    };
   },
  );
