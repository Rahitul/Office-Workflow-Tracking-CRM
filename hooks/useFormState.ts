import { useState, useCallback } from 'react';
import { z, ZodTypeAny } from 'zod';

interface FormState<T> {
  values: T;
  errors: Partial<Record<keyof T, string>>;
  isValid: boolean;
  isDirty: boolean;
}

interface UseFormStateOptions<T> {
  initialValues: T;
  schema?: ZodTypeAny;
}

export function useFormState<T extends Record<string, any>>({
  initialValues,
  schema,
}: UseFormStateOptions<T>) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  const validate = useCallback(() => {
    if (!schema) {
      setErrors({});
      return true;
    }

    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (err) {
      if (err instanceof z.ZodError) {
        const formattedErrors: Partial<Record<keyof T, string>> = {};
        err.issues.forEach((error) => {
          const path = error.path.join('.') as keyof T;
          formattedErrors[path] = error.message;
        });
        setErrors(formattedErrors);
        return false;
      }
      throw err;
    }
  }, [schema, values]);

  const setValue = useCallback((field: keyof T, value: any) => {
    setValues((prev) => {
      const newValues = { ...prev, [field]: value };
      setIsDirty(true);
      return newValues;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setIsDirty(false);
  }, [initialValues]);

  const isValid = Object.keys(errors).length === 0;

  return {
    values,
    errors,
    isValid,
    isDirty,
    setValue,
    reset,
    validate,
  };
}