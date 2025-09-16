import { describe, it, expect, vi } from "vitest";
// import { render, screen } from "@/test-utils";
import { render, screen } from "@testing-library/react";
// import userEvent from "@testing-library/user-event";
import App from "@/App";

// Mock the components to focus on navigation
vi.mock("@/pages/Dashboard", () => ({
  Dashboard: () => <div>Dashboard Page</div>,
}));

vi.mock("@/pages/Results", () => ({
  Results: () => <div>Results Page</div>,
}));

describe("App Navigation", () => {
  it("renders dashboard by default", () => {
    render(<App />);
    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
  });

  // Add more navigation tests as needed
});
