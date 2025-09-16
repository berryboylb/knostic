import { describe, it, expect } from "vitest";
// import { render, screen } from "@/test-utils";
import { render, screen } from "@testing-library/react";
import { Dashboard } from "@/pages/Dashboard";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>{ui}</QueryClientProvider>
    </MemoryRouter>
  );
}

describe("Dashboard", () => {
  it("renders welcome header and instructions", () => {
    renderWithClient(<Dashboard />);

    expect(screen.getByText("CSV Data Manager")).toBeInTheDocument();
    expect(
      screen.getByText(/Upload your strings and classifications CSV files to validate data integrity and manage your datasets/)
    ).toBeInTheDocument();
    expect(screen.getByText("Expected File Formats")).toBeInTheDocument();
  });

  

  it("renders upload section", () => {
    renderWithClient(<Dashboard />);

    expect(screen.getByText("Upload Your CSV Files")).toBeInTheDocument();
    expect(screen.getByText("Browse Files")).toBeInTheDocument();
  });

  it("has proper heading hierarchy for accessibility", () => {
    renderWithClient(<Dashboard />);
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThanOrEqual(3);
  });
});
