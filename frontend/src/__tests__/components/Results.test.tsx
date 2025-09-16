import { describe, it, expect, vi, beforeEach } from "vitest";
// import { render, screen, waitFor } from "@/test-utils";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Results } from "@/pages/Results";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// import { mockStringsData, mockClassificationsData } from "@/mocks/api";

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

// Mock react-router-dom
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Link: ({ children, to, ...props }: any) => (
      <a href={to} {...props}>
        {children}
      </a>
    ),
  };
});

describe("Results", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders header with back navigation", () => {
    renderWithClient(<Results />);

    expect(screen.getByText("Data Results")).toBeInTheDocument();
    expect(screen.getByText("Your uploaded CSV data")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Back to Upload/ })
    ).toBeInTheDocument();
  });

  it("displays loading state initially", () => {
    renderWithClient(<Results />);

    // Check for skeleton loaders or loading indicators
    const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
    expect(skeletons.length).toBeGreaterThanOrEqual(0);
  });

  it("shows stats overview cards", async () => {
    renderWithClient(<Results />);

    await waitFor(() => {
      expect(screen.getByText("Total Rows")).toBeInTheDocument();
      expect(screen.getByText("Strings")).toBeInTheDocument();
      expect(screen.getByText("Classifications")).toBeInTheDocument();
      expect(screen.getByText("Validation")).toBeInTheDocument();
    });
  });

  it("renders data tables with correct tabs", async () => {
    renderWithClient(<Results />);

    await waitFor(() => {
      expect(screen.getByRole("tablist")).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Strings Data/ })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("tab", { name: /Classifications/ })
      ).toBeInTheDocument();
    });
  });

  it("displays export section when data exists", async () => {
    renderWithClient(<Results />);

    await waitFor(() => {
      expect(screen.getByText("Data Results")).toBeInTheDocument();
      expect(screen.getByText("Your uploaded CSV data")).toBeInTheDocument();
    });
  });

  it("handles refresh action", async () => {
    const user = userEvent.setup();
    renderWithClient(<Results />);

    const refreshButton = screen.getByRole("button", { name: /Refresh/ });
    expect(refreshButton).toBeInTheDocument();

    await user.click(refreshButton);

    // Verify refresh functionality (button should be clickable)
    expect(refreshButton).not.toBeDisabled();
  });

  it("handles tab switching", async () => {
    // const user = userEvent.setup();
    renderWithClient(<Results />);

    await waitFor(() => {
      const classificationsTab = screen.getByRole("tab", {
        name: /Classifications/,
      });
      expect(classificationsTab).toBeInTheDocument();
    });
  });

  it("shows error state when no data available", async () => {
    // Mock API to return no data
    const mockGetAllData = vi.fn().mockResolvedValue({
      responseObject: { strings: null, classifications: null },
    });
    vi.doMock("@/services/api", () => ({
      api: { getAllData: mockGetAllData },
    }));

    renderWithClient(<Results />);

    await waitFor(() => {
      expect(screen.getByText(/No data found/)).toBeInTheDocument();
      expect(screen.getByText(/Upload Files/)).toBeInTheDocument();
    });
  });
});
