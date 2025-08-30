
import { Suspense } from "react";

import {  dehydrate, HydrationBoundary } from "@tanstack/react-query";

import { trpc, getQueryClient } from "@/trpc/server";

import { Client } from "./client";


const Page = async () => {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(trpc.CreateAI.queryOptions({text: "Bibek PREFETCH"}))

  return (
    <HydrationBoundary state = {dehydrate(queryClient)}>
      <Suspense fallback={<p>Loading...</p>}>
      <Client / >
      </Suspense>
    </HydrationBoundary>
  );
}

export default Page;
