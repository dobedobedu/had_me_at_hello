"use client";

import * as React from "react";
import type { EmblaOptionsType, EmblaPluginType, UseEmblaCarouselType } from "embla-carousel-react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type EmblaHookReturn = UseEmblaCarouselType;
type EmblaCarouselRef = EmblaHookReturn[0];
type EmblaCarouselApi = EmblaHookReturn[1];

export type CarouselApi = NonNullable<EmblaCarouselApi>;
export type CarouselOptions = EmblaOptionsType;
export type CarouselPlugin = EmblaPluginType;

interface CarouselContextValue {
  carouselRef: EmblaCarouselRef;
  api: EmblaCarouselApi;
}

const CarouselContext = React.createContext<CarouselContextValue | null>(null);

function useCarouselContext(component: string) {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error(`<${component}> must be used within <Carousel />`);
  }

  return context;
}

export interface CarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin[];
  setApi?: (api: EmblaCarouselApi) => void;
}

export const Carousel = React.forwardRef<HTMLDivElement, CarouselProps>(
  ({ className, opts, plugins, setApi, children, ...props }, ref) => {
    const [carouselRef, api] = useEmblaCarousel(opts, plugins);

    React.useEffect(() => {
      if (!setApi) return;
      setApi(api ?? undefined);

      return () => setApi(undefined);
    }, [api, setApi]);

    return (
      <CarouselContext.Provider value={{ carouselRef, api }}>
        <div ref={ref} className={cn("relative", className)} {...props}>
          {children}
        </div>
      </CarouselContext.Provider>
    );
  }
);
Carousel.displayName = "Carousel";

export interface CarouselContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CarouselContent = React.forwardRef<
  HTMLDivElement,
  CarouselContentProps
>(({ className, ...props }, ref) => {
  const { carouselRef } = useCarouselContext("CarouselContent");

  return (
    <div ref={carouselRef} className="overflow-hidden">
      <div
        ref={ref}
        className={cn("flex -ml-6", className)}
        {...props}
      />
    </div>
  );
});
CarouselContent.displayName = "CarouselContent";

export interface CarouselItemProps
  extends React.HTMLAttributes<HTMLDivElement> {}

export const CarouselItem = React.forwardRef<HTMLDivElement, CarouselItemProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("min-w-0 shrink-0 grow-0 basis-full pl-6", className)}
      {...props}
    />
  )
);
CarouselItem.displayName = "CarouselItem";

export const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { api } = useCarouselContext("CarouselPrevious");

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 shadow-sm backdrop-blur-sm",
        "disabled:opacity-40",
        className
      )}
      onClick={() => api?.scrollPrev()}
      disabled={!api}
      {...props}
    >
      <ArrowLeft className="h-5 w-5" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
});
CarouselPrevious.displayName = "CarouselPrevious";

export const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => {
  const { api } = useCarouselContext("CarouselNext");

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      className={cn(
        "absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 shadow-sm backdrop-blur-sm",
        "disabled:opacity-40",
        className
      )}
      onClick={() => api?.scrollNext()}
      disabled={!api}
      {...props}
    >
      <ArrowRight className="h-5 w-5" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
});
CarouselNext.displayName = "CarouselNext";

export const CarouselViewport = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { carouselRef } = useCarouselContext("CarouselViewport");

  return (
    <div ref={carouselRef} className={cn("relative overflow-hidden", className)} {...props} />
  );
});
CarouselViewport.displayName = "CarouselViewport";

export function useCarouselApi() {
  const context = React.useContext(CarouselContext);
  return context?.api;
}
