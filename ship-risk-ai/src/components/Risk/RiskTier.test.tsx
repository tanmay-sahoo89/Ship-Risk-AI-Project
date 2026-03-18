import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RiskTier } from "./RiskTier";

describe("RiskTier Component", () => {
  it("renders correctly with LOW tier", () => {
    render(<RiskTier tier="LOW" probability={0.2} />);
    const element = screen.getByText("LOW");
    expect(element).toBeInTheDocument();
  });

  it("renders correctly with CRITICAL tier", () => {
    render(<RiskTier tier="CRITICAL" probability={0.95} />);
    const element = screen.getByText("CRITICAL");
    expect(element).toBeInTheDocument();
  });

  it("displays probability percentage when showProbability is true", () => {
    render(<RiskTier tier="HIGH" probability={0.75} showProbability={true} />);
    const probability = screen.getByText(/75\.0%/);
    expect(probability).toBeInTheDocument();
  });

  it("hides probability when showProbability is false", () => {
    render(<RiskTier tier="HIGH" probability={0.75} showProbability={false} />);
    const probability = screen.queryByText(/75\.0%/);
    expect(probability).not.toBeInTheDocument();
  });

  it("renders all tier levels", () => {
    const tiers = ["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;

    tiers.forEach((tier) => {
      const { unmount } = render(<RiskTier tier={tier} probability={0.5} />);
      expect(screen.getByText(tier)).toBeInTheDocument();
      unmount();
    });
  });
});
