import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "./utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "leading-none whitespace-nowrap select-none",
    "gap-1.5 sm:gap-2",
    "rounded-lg sm:rounded-md",
    "text-xs sm:text-sm font-medium",
    "transition-all",
    "disabled:pointer-events-none disabled:opacity-50",
    "outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-2 sm:focus-visible:ring-[3px]",
    "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
    // ✅ flex safety in tight headers
    "shrink-0 min-w-0",
    // ✅ icon sizing only (NOT the button)
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-3 sm:[&_svg:not([class*='size-'])]:size-4",
    // optional feel
    "active:scale-[0.98]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border border-[1.5px] sm:border bg-background text-foreground hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "min-h-[44px] sm:min-h-0 sm:h-9 px-3 sm:px-4 py-2.5 sm:py-2 has-[>svg]:px-2.5 sm:has-[>svg]:px-3",
        sm:
          "min-h-[40px] sm:min-h-0 sm:h-8 px-2.5 sm:px-3 py-2 sm:py-0 text-xs rounded-lg sm:rounded-md has-[>svg]:px-2 sm:has-[>svg]:px-2.5",
        lg:
          "min-h-[48px] sm:min-h-0 sm:h-10 px-4 sm:px-6 py-3 sm:py-2.5 text-sm sm:text-base rounded-lg sm:rounded-md has-[>svg]:px-3 sm:has-[>svg]:px-4",
        icon:
          "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:size-9 rounded-lg sm:rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      type={type ?? "button"}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { Button, buttonVariants };
