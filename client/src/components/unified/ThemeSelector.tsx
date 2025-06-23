import { useTheme, type UITheme } from "@/providers/ThemeProvider";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, Palette } from "lucide-react";

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  const themes: { value: UITheme; label: string }[] = [
    { value: 'shadcn', label: 'Shadcn/UI' },
    { value: 'mui', label: 'Material-UI' },
    { value: 'turbotax', label: 'TurboTax Style' },
  ];

  const currentThemeLabel = themes.find(t => t.value === theme)?.label || 'Unknown';

  if (theme === 'mui' || theme === 'turbotax') {
    // Return null for MUI themes since we can't easily mix shadcn components
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="h-4 w-4" />
          {currentThemeLabel}
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((themeOption) => (
          <DropdownMenuItem
            key={themeOption.value}
            onClick={() => setTheme(themeOption.value)}
            className={theme === themeOption.value ? "bg-accent" : ""}
          >
            {themeOption.label}
            {theme === themeOption.value && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}