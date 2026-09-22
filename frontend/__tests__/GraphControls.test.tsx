import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GraphToolbar } from "@/components/workbench/GraphToolbar";

describe("GraphToolbar", () => {
  it("invokes the matching callback for each control", () => {
    const onZoomIn = vi.fn();
    const onZoomOut = vi.fn();
    const onFit = vi.fn();
    const onReset = vi.fn();
    render(<GraphToolbar onZoomIn={onZoomIn} onZoomOut={onZoomOut} onFit={onFit} onReset={onReset} />);

    fireEvent.click(screen.getByLabelText("Zoom in"));
    fireEvent.click(screen.getByLabelText("Zoom out"));
    fireEvent.click(screen.getByLabelText("Fit graph to view"));
    fireEvent.click(screen.getByLabelText("Reset view"));

    expect(onZoomIn).toHaveBeenCalledOnce();
    expect(onZoomOut).toHaveBeenCalledOnce();
    expect(onFit).toHaveBeenCalledOnce();
    expect(onReset).toHaveBeenCalledOnce();
  });
});
