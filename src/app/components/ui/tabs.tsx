"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "./utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        // Mobile: horizontal scroll chips
        "bg-muted text-muted-foreground flex w-full items-center justify-start gap-2 rounded-2xl p-2 overflow-x-auto overflow-y-hidden whitespace-nowrap scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        // Desktop: turn into a wrapping grid (no scroll)
        "md:overflow-visible md:whitespace-normal md:grid md:grid-cols-4 lg:grid-cols-7 md:gap-2 md:justify-start",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base
        "inline-flex items-center justify-center gap-1.5 rounded-xl border border-transparent font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:ring-2 sm:focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Sizing
        "h-10 px-4 text-xs sm:text-sm whitespace-nowrap",
        // Mobile behavior: chip (don't stretch)
        "flex-none shrink-0 min-h-[44px] sm:min-h-0",
        // Desktop behavior: fill grid cell and allow wrapping label if needed
        "md:w-full md:flex md:whitespace-normal md:py-2",
        // Active styles (default)
        "data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm dark:data-[state=active]:text-foreground dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground",
        // Touch optimization
        "touch-manipulation",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
