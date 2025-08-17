declare module 'graphql-validation-complexity' {
  import { ValidationRule } from 'graphql';
  
  interface ComplexityOptions {
    onCost?: (cost: number) => void;
    formatErrorMessage?: (cost: number) => string;
  }
  
  export function createComplexityLimitRule(
    maxCost: number,
    options?: ComplexityOptions
  ): ValidationRule;
}