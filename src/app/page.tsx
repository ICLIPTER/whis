
"use client"

import { toast } from "sonner";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";


const Page = () => {
  const router = useRouter();
  const [value, setValue] = useState("");

  const trpc = useTRPC();
  const createProject = useMutation(trpc.projects.create.mutationOptions({
  onError:(error) => {
    toast.error(error.message);
  },
  onSuccess: ( data ) => {
      router.push(`/projects/${data.name}`);
  },
}));


  
  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="max-w-7xl mx-auto flex items-center justify-center flex-col gap-y-4">
      <Input value={value} onChange={(e) => setValue(e.target.value)} />
     <Button disabled={createProject.isPending} onClick={() => createProject.mutate({ value: value})}>
      Submit
     </Button>
    </div>
    </div>
  );
}

export default Page;
