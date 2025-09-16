import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from "@tanstack/react-query";
import { api } from "@/services/api";
import { vi } from "vitest";

vi.mock("@/services/api", () => ({
  api: {
    getAllData: vi.fn().mockResolvedValue([{ id: 1, name: "test" }]),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Query Hooks", () => {
  it("fetches all data successfully", async () => {
    const { result } = renderHook(
      () =>
        useQuery({
          queryKey: ["all-data"],
          queryFn: api.getAllData,
        }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeDefined();
  });
});
