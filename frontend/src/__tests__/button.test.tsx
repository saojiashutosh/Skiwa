import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Add to Cart</Button>);
    expect(screen.getByRole("button", { name: /add to cart/i })).toBeInTheDocument();
  });

  it("is disabled while loading", () => {
    render(<Button loading>Checkout</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("respects the disabled prop", () => {
    render(<Button disabled>Sold Out</Button>);
    expect(screen.getByRole("button")).toBeDisabled();
  });

  it("renders as a child element with asChild", () => {
    render(
      <Button asChild>
        <a href="/shop">Shop</a>
      </Button>,
    );
    expect(screen.getByRole("link", { name: /shop/i })).toHaveAttribute("href", "/shop");
  });
});
