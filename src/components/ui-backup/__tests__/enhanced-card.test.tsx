import React from "react";
import { render } from "@testing-library/react";
import {
    EnhancedCard,
    EnhancedCardHeader,
    EnhancedCardTitle,
    EnhancedCardDescription,
    EnhancedCardContent,
} from "../enhanced-card";

describe("EnhancedCard", () => {
    it("renders with default variant", () => {
        const { container } = render(
            <EnhancedCard>
                <EnhancedCardHeader>
                    <EnhancedCardTitle>Test Card</EnhancedCardTitle>
                </EnhancedCardHeader>
            </EnhancedCard>
        );
        expect(container.firstChild).toBeInTheDocument();
    });

    it("applies elevated variant classes", () => {
        const { container } = render(
            <EnhancedCard variant="elevated">
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("shadow-lg");
    });

    it("applies bordered variant classes", () => {
        const { container } = render(
            <EnhancedCard variant="bordered">
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("border-2");
    });

    it("applies glass variant classes", () => {
        const { container } = render(
            <EnhancedCard variant="glass">
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("backdrop-blur-sm");
    });

    it("applies gradient variant classes", () => {
        const { container } = render(
            <EnhancedCard variant="gradient">
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("bg-gradient-to-br");
    });

    it("applies interactive hover effects when interactive prop is true", () => {
        const { container } = render(
            <EnhancedCard interactive>
                <EnhancedCardContent>Interactive Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("cursor-pointer");
        expect(card.className).toContain("hover:scale-[1.02]");
    });

    it("shows loading state with skeleton content", () => {
        const { container } = render(
            <EnhancedCard loading>
                <EnhancedCardContent>This should not appear</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("animate-pulse");
        // Check for skeleton elements
        const skeletons = container.querySelectorAll(".bg-muted");
        expect(skeletons.length).toBeGreaterThan(0);
    });

    it("does not apply interactive classes when loading", () => {
        const { container } = render(
            <EnhancedCard loading interactive>
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).not.toContain("cursor-pointer");
    });

    it("renders children when not loading", () => {
        const { getByText } = render(
            <EnhancedCard>
                <EnhancedCardHeader>
                    <EnhancedCardTitle>Test Title</EnhancedCardTitle>
                    <EnhancedCardDescription>Test Description</EnhancedCardDescription>
                </EnhancedCardHeader>
                <EnhancedCardContent>Test Content</EnhancedCardContent>
            </EnhancedCard>
        );
        expect(getByText("Test Title")).toBeInTheDocument();
        expect(getByText("Test Description")).toBeInTheDocument();
        expect(getByText("Test Content")).toBeInTheDocument();
    });

    it("accepts custom className", () => {
        const { container } = render(
            <EnhancedCard className="custom-class">
                <EnhancedCardContent>Content</EnhancedCardContent>
            </EnhancedCard>
        );
        const card = container.firstChild as HTMLElement;
        expect(card.className).toContain("custom-class");
    });
});
