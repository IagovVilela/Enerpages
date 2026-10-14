import { cn } from "@/lib/cn";

export function visibilityClass(visibility: { desktop: boolean; tablet: boolean; mobile: boolean }) {
  return cn(!visibility.mobile && "max-md:hidden", !visibility.tablet && "md:max-lg:hidden", !visibility.desktop && "lg:hidden");
}
