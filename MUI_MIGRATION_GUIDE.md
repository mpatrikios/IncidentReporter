# Material-UI Migration Guide

## Overview
This guide outlines the migration from Shadcn/UI (Radix UI) to Material-UI (MUI) while maintaining all existing functionality.

## Migration Status

### Completed
- ✅ MUI dependencies installed
- ✅ TurboTax-inspired theme configuration created
- ✅ MUI Provider setup
- ✅ Login page refactored (login-mui.tsx)
- ✅ Dashboard refactored (home-mui.tsx)
- ✅ Wizard layout component created (MuiWizardLayout.tsx)
- ✅ Sample form step component (project-information-mui.tsx)

### Pending
- ⏳ Complete report wizard migration
- ⏳ Migrate remaining form steps
- ⏳ Update global styles
- ⏳ Test accessibility compliance
- ⏳ Remove old Shadcn/UI components

## How to Test MUI Components

### Option 1: Environment Variable
Set in your `.env` file:
```
VITE_USE_MUI=true
```

### Option 2: Browser Console
```javascript
localStorage.setItem('useMUI', 'true');
location.reload();
```

To switch back to original UI:
```javascript
localStorage.removeItem('useMUI');
location.reload();
```

## Component Mapping Guide

### Basic Components
| Shadcn/UI | Material-UI | Notes |
|-----------|-------------|-------|
| Button | Button | Use variant="contained/outlined/text" |
| Card | Card + CardContent | MUI requires CardContent wrapper |
| Input | TextField | Includes label and helper text |
| Textarea | TextField multiline | Set multiline prop |
| Badge | Chip | More interactive options |
| DropdownMenu | Menu + MenuItem | Requires anchorEl state |
| Form | Built-in validation | Use Controller from react-hook-form |
| Toast | Snackbar | Or keep existing toast |

### Form Components
| Shadcn/UI | Material-UI | Implementation |
|-----------|-------------|----------------|
| FormField | Controller | Wrap MUI components with Controller |
| FormLabel | Built into TextField | Use label prop |
| FormMessage | Built into TextField | Use helperText and error props |
| Calendar | DatePicker | From @mui/x-date-pickers |
| Select | Autocomplete or Select | Autocomplete for searchable options |
| Checkbox | Checkbox | With FormControlLabel |
| RadioGroup | RadioGroup | With Radio components |

## Migration Patterns

### 1. Form Field Migration
**Shadcn/UI Pattern:**
```tsx
<FormField
  control={form.control}
  name="fieldName"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Field Label</FormLabel>
      <FormControl>
        <Input {...field} />
      </FormControl>
      <FormMessage />
    </FormItem>
  )}
/>
```

**MUI Pattern:**
```tsx
<Controller
  name="fieldName"
  control={control}
  render={({ field, fieldState }) => (
    <TextField
      {...field}
      fullWidth
      label="Field Label"
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

### 2. Card Migration
**Shadcn/UI Pattern:**
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
</Card>
```

**MUI Pattern:**
```tsx
<Card>
  <CardContent>
    <Typography variant="h6" gutterBottom>
      Title
    </Typography>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      Description
    </Typography>
    <Box>Content</Box>
  </CardContent>
</Card>
```

### 3. Button Migration
**Shadcn/UI Pattern:**
```tsx
<Button variant="default" size="lg">
  Click Me
</Button>
```

**MUI Pattern:**
```tsx
<Button variant="contained" size="large">
  Click Me
</Button>
```

## TurboTax-Inspired Design Principles

### 1. Progressive Disclosure
- Show only necessary information at each step
- Use expansion panels for advanced options
- Clear visual hierarchy

### 2. Friendly Language
- Use conversational tone in UI copy
- Provide helpful explanations
- Avoid technical jargon

### 3. Visual Feedback
- Clear progress indicators (Stepper component)
- Success/error states with colors
- Loading states for all async operations

### 4. Guided Experience
- Step-by-step wizard interface
- Clear next/previous navigation
- Auto-save functionality with visual feedback

## Styling Approach

### Theme Usage
```tsx
import { useTheme } from '@mui/material/styles';

const theme = useTheme();
// Access theme.palette, theme.typography, etc.
```

### Responsive Design
```tsx
import { useMediaQuery } from '@mui/material';

const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
const isTablet = useMediaQuery(theme.breakpoints.down('md'));
```

### Custom Styling with sx prop
```tsx
<Box
  sx={{
    p: 2, // padding: theme.spacing(2)
    m: { xs: 1, sm: 2 }, // responsive margin
    bgcolor: 'background.paper',
    borderRadius: 2,
    '&:hover': {
      bgcolor: 'action.hover',
    },
  }}
>
```

## Accessibility Checklist

- [ ] All interactive elements have proper ARIA labels
- [ ] Form fields have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Keyboard navigation works for all interactions
- [ ] Focus indicators are visible
- [ ] Color contrast meets WCAG standards
- [ ] Loading states are announced

## Testing Steps

1. **Visual Testing**
   - Compare layouts at different screen sizes
   - Verify theme consistency
   - Check hover/focus states

2. **Functional Testing**
   - All forms submit correctly
   - API calls work as expected
   - Navigation flows are preserved
   - Auto-save functionality works

3. **Accessibility Testing**
   - Use keyboard-only navigation
   - Test with screen reader
   - Check color contrast ratios
   - Verify ARIA labels

## Rollback Plan

If issues arise, the original UI can be restored by:
1. Setting `useMUI` to false
2. Original components remain untouched
3. No database or API changes required

## Next Steps

1. Complete migration of remaining wizard steps
2. Update report generation component with MUI Stepper
3. Test all functionality thoroughly
4. Get user feedback on new design
5. Plan removal of old components

## Resources

- [MUI Documentation](https://mui.com/material-ui/getting-started/)
- [MUI Component Demos](https://mui.com/material-ui/react-autocomplete/)
- [TurboTax Design Principles](https://turbotax.intuit.com/)
- [React Hook Form with MUI](https://react-hook-form.com/get-started#IntegratingwithUIlibraries)