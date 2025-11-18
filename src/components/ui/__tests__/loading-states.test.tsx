import { render, screen } from "@testing-library/react";
import {
    SkeletonCard,
    AILoader,
    StepLoader,
    Skeleton,
} from "../loading-states";

describe("Loading States Components", () => {
    describe("SkeletonCard", () => {
        it("renders skeleton card with pulsing animation", () => {
            const { container } = render(<SkeletonCard />);
            const card = container.querySelector(".animate-pulse");
            expect(card).toBeInTheDocument();
        });

        it("renders skeleton elements for header and content", () => {
            const { container } = render(<SkeletonCard />);
            const skeletonElements = container.querySelectorAll(".bg-muted");
            expect(skeletonElements.length).toBeGreaterThan(0);
        });
    });

    describe("AILoader", () => {
        it("renders with default message", () => {
            render(<AILoader />);
            expect(screen.getByText("AI is working its magic...")).toBeInTheDocument();
        });

        it("renders with custom message", () => {
            render(<AILoader message="Generating your marketing plan..." />);
            expect(
                screen.getByText("Generating your marketing plan...")
            ).toBeInTheDocument();
        });

        it("renders spinning animation", () => {
            const { container } = render(<AILoader />);
            const spinner = container.querySelector(".animate-spin");
            expect(spinner).toBeInTheDocument();
        });

        it("renders sparkles icon", () => {
            const { container } = render(<AILoader />);
            const sparkles = container.querySelector("svg");
            expect(sparkles).toBeInTheDocument();
        });
    });

    describe("StepLoader", () => {
        const steps = ["Step 1", "Step 2", "Step 3"];

        it("renders all steps", () => {
            render(<StepLoader steps={steps} currentStep={0} />);
            steps.forEach((step) => {
                expect(screen.getByText(step)).toBeInTheDocument();
            });
        });

        it("shows completed steps with check icon", () => {
            const { container } = render(<StepLoader steps={steps} currentStep={2} />);
            const checkIcons = container.querySelectorAll(".bg-success");
            expect(checkIcons.length).toBe(2); // Steps 0 and 1 should be completed
        });

        it("highlights current step", () => {
            const { container } = render(<StepLoader steps={steps} currentStep={1} />);
            const currentStepElement = container.querySelector(".bg-primary");
            expect(currentStepElement).toBeInTheDocument();
        });

        it("shows step numbers for incomplete steps", () => {
            render(<StepLoader steps={steps} currentStep={0} />);
            expect(screen.getByText("2")).toBeInTheDocument();
            expect(screen.getByText("3")).toBeInTheDocument();
        });
    });

    describe("Skeleton", () => {
        it("renders with default classes", () => {
            const { container } = render(<Skeleton />);
            const skeleton = container.firstChild;
            expect(skeleton).toHaveClass("animate-pulse");
            expect(skeleton).toHaveClass("rounded-md");
            expect(skeleton).toHaveClass("bg-muted");
        });

        it("accepts custom className", () => {
            const { container } = render(<Skeleton className="h-10 w-full" />);
            const skeleton = container.firstChild;
            expect(skeleton).toHaveClass("h-10");
            expect(skeleton).toHaveClass("w-full");
        });
    });
});
