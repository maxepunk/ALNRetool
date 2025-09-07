# UI Component Conventions

This document outlines the conventions for using and extending UI components in this project, with a focus on maintaining a consistent visual design and a scalable, maintainable component architecture. Our UI library is based on [shadcn/ui](https://ui.shadcn.com/).

## Guiding Principles

1.  **Consistency is Key:** The primary goal is a cohesive user experience. Components should look and behave consistently across the application.
2.  **`src/components/ui` is the Single Source of Truth:** All base UI components (Buttons, Cards, Inputs, etc.) should reside in `src/components/ui`. These are our "visual primitives."
3.  **Compose, Don't Reinvent:** Before building a new component, always check if the desired functionality can be achieved by composing existing components from `src/components/ui`.
4.  **Extend, Don't Override:** When a `ui` component needs a new style or behavior, extend it by creating a new variant within the component's file itself, rather than applying one-off Tailwind CSS classes at the point of use.

## Rules of Engagement

### 1. Using Existing `ui` Components

- **Priority:** Always prefer using a component from `src/components/ui` over building a custom one.
- **Styling:** Use the `variant` and `size` props to style components. Avoid applying custom, one-off styling classes directly to a `ui` component instance. If the required style doesn't exist, see "Creating New Component Variants."

### 2. Adding New `ui` Components

- If a required component doesn't exist in `src/components/ui`, you can add it from the official `shadcn/ui` registry.
- **Command:** Use the `shadcn-ui` CLI to add new components:
  ```bash
  npx shadcn-ui@latest add [component-name]
  ```
- This ensures the component is added with the correct dependencies and configuration, consistent with the rest of the project.

### 3. Creating New Component Variants

- If a `ui` component needs a new visual style (e.g., a "success" button or a "warning" badge), create a new variant for it.
- **Process:**
    1.  Open the component's file (e.g., `src/components/ui/badge.tsx`).
    2.  Locate the `cva` (Class Variance Authority) call.
    3.  Add your new variant to the `variants` object.
- **Example (Adding a "success" variant to `Badge`):**
  ```typescript
  // src/components/ui/badge.tsx

  const badgeVariants = cva(
    /* ... base classes ... */,
    {
      variants: {
        variant: {
          default: "...",
          secondary: "...",
          destructive: "...",
          outline: "...",
          // Add new variant here
          success: "border-transparent bg-green-100 text-green-800 hover:bg-green-100/80",
        },
      },
      // ...
    }
  )
  ```

### 4. Creating New "Common" Components

- If you need to create a new, reusable component that is specific to this application's domain (i.e., it's not a generic UI primitive), you can create it in `src/components/common`.
- **Convention:** A "common" component should be composed of components from `src/components/ui`. It should encapsulate a piece of application-specific logic or layout.
- **Example:** A `UserAvatar` component that combines the `Avatar` `ui` component with logic to fetch and display the current user's information.

### 5. When to use Custom Tailwind CSS Classes

- It is acceptable to use custom Tailwind CSS for page-level layouts and for positioning components (e.g., using `flex`, `grid`, `margin`, `padding`).
- However, the *internal styling* of a reusable component should be defined within its `cva` variants.

By following these conventions, we can ensure that our UI remains consistent, scalable, and easy to work with.
