import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import {
    VirtualStagingForm,
    DayToDuskForm,
    EnhanceForm,
    VirtualRenovationForm,
} from "../index";

describe("Edit Forms", () => {
    describe("VirtualStagingForm", () => {
        it("renders with all required fields", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(<VirtualStagingForm onSubmit={onSubmit} onCancel={onCancel} />);

            expect(screen.getByText("Room Type")).toBeInTheDocument();
            expect(screen.getByText("Furniture Style")).toBeInTheDocument();
            expect(screen.getByText("Generate Staging")).toBeInTheDocument();
        });

        it("calls onSubmit with valid params", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(
                <VirtualStagingForm
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                    defaultValues={{ roomType: "living-room", style: "modern" }}
                />
            );

            const submitButton = screen.getByText("Generate Staging");
            fireEvent.click(submitButton);

            expect(onSubmit).toHaveBeenCalledWith({
                roomType: "living-room",
                style: "modern",
            });
        });
    });

    describe("DayToDuskForm", () => {
        it("renders with intensity selector", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(<DayToDuskForm onSubmit={onSubmit} onCancel={onCancel} />);

            expect(screen.getByText("Lighting Intensity")).toBeInTheDocument();
            expect(screen.getByText("Convert to Dusk")).toBeInTheDocument();
        });

        it("defaults to moderate intensity", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(<DayToDuskForm onSubmit={onSubmit} onCancel={onCancel} />);

            const submitButton = screen.getByText("Convert to Dusk");
            fireEvent.click(submitButton);

            expect(onSubmit).toHaveBeenCalledWith({ intensity: "moderate" });
        });
    });

    describe("EnhanceForm", () => {
        it("renders with auto-adjust toggle", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(<EnhanceForm onSubmit={onSubmit} onCancel={onCancel} />);

            expect(screen.getByText("Auto Adjust")).toBeInTheDocument();
            expect(screen.getByText("Enhance Image")).toBeInTheDocument();
        });

        it("calls onSubmit with auto-adjust enabled by default", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(<EnhanceForm onSubmit={onSubmit} onCancel={onCancel} />);

            const submitButton = screen.getByText("Enhance Image");
            fireEvent.click(submitButton);

            expect(onSubmit).toHaveBeenCalledWith({ autoAdjust: true });
        });
    });

    describe("VirtualRenovationForm", () => {
        it("renders with description textarea", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(
                <VirtualRenovationForm onSubmit={onSubmit} onCancel={onCancel} />
            );

            expect(screen.getByText("Renovation Description")).toBeInTheDocument();
            expect(screen.getByText("Visualize Renovation")).toBeInTheDocument();
        });

        it("validates minimum description length", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(
                <VirtualRenovationForm onSubmit={onSubmit} onCancel={onCancel} />
            );

            const textarea = screen.getByPlaceholderText(/Describe the renovations/);
            fireEvent.change(textarea, { target: { value: "short" } });

            const submitButton = screen.getByText("Visualize Renovation");
            fireEvent.click(submitButton);

            expect(onSubmit).not.toHaveBeenCalled();
            expect(
                screen.getByText("Description must be at least 10 characters")
            ).toBeInTheDocument();
        });

        it("calls onSubmit with valid description", () => {
            const onSubmit = vi.fn();
            const onCancel = vi.fn();

            render(
                <VirtualRenovationForm onSubmit={onSubmit} onCancel={onCancel} />
            );

            const textarea = screen.getByPlaceholderText(/Describe the renovations/);
            fireEvent.change(textarea, {
                target: { value: "Replace old cabinets with modern white ones" },
            });

            const submitButton = screen.getByText("Visualize Renovation");
            fireEvent.click(submitButton);

            expect(onSubmit).toHaveBeenCalledWith({
                description: "Replace old cabinets with modern white ones",
            });
        });
    });
});
